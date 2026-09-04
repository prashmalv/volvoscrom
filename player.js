// ─────────────────────────────────────────────────────────────────
//  Shared course video player
//  Single source of truth for playback behaviour across every SCORM
//  package in this repo. build_video_course.py and build_module1.py
//  copy this file into each package.
//
//  Why custom controls instead of the browser's own:
//  controlsList="noplaybackrate" is not dependable. Whether it hides
//  the speed menu varies by browser and version — Safari on macOS
//  ignores controlsList entirely, and some Chrome builds still show
//  the menu — so learners could run a module at 1.5x and finish it in
//  two thirds of the time. There is no attribute that reliably removes
//  the control, so this player doesn't use native controls at all.
//  Nothing in the bar below changes playback speed, on any browser.
//
//  Exposes:
//    window.onVideoComplete  — hook, called once the video is genuinely watched
//    resetPlayer()           — full reset (used when a course is relaunched)
//    playerState()           — { maxWatched, playedSeconds, complete }
// ─────────────────────────────────────────────────────────────────

const PLAYER_CONFIG = {
  completeAt:    0.95,  // video position that counts as "reached the end"
  minWatchRatio: 0.85,  // real seconds of playback needed, as a share of duration
  seekStep:      5      // arrow-key seek, in seconds
};

const video = document.getElementById("video");

let maxWatched    = 0;      // furthest position reached (rewind stays allowed)
let playedSeconds = 0;      // real time actually spent playing
let lastTick      = null;   // wall-clock marker for the accumulator
let lastBookmark  = 0;
let videoComplete = false;

// ─── Playback speed lock ─────────────────────────────────────────
// Backstop for anything that sets the rate without going through a
// control we drew: an extension, a keyboard shortcut, devtools.
video.defaultPlaybackRate = 1;

function enforceRate() {
  // Self-limiting: the assignment re-fires ratechange, but the rate is
  // already 1 by then and the branch is skipped.
  if (video.playbackRate !== 1) video.playbackRate = 1;
  if (video.defaultPlaybackRate !== 1) video.defaultPlaybackRate = 1;
}

video.addEventListener("ratechange", enforceRate);
video.addEventListener("play", enforceRate);
video.addEventListener("seeked", enforceRate);

// ─── Control bar ─────────────────────────────────────────────────
// Built here rather than in each index.html so every package gets the
// identical bar.
video.removeAttribute("controls");
video.setAttribute("playsinline", "");

const bar = document.createElement("div");
bar.className = "vc-bar";
bar.innerHTML =
  '<button class="vc-btn" id="vcPlay" type="button" aria-label="Play">' +
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">' +
      '<path id="vcPlayIcon" d="M4 2.5v11l9-5.5z"/></svg></button>' +
  '<div class="vc-seek" id="vcSeek" role="slider" tabindex="0" aria-label="Seek"' +
    ' aria-valuemin="0" aria-valuenow="0" aria-valuetext="0 seconds">' +
    '<div class="vc-seek-track">' +
      '<div class="vc-seek-watched" id="vcWatched"></div>' +
      '<div class="vc-seek-played"  id="vcPlayed"></div>' +
      '<div class="vc-seek-knob"    id="vcKnob"></div>' +
    '</div></div>' +
  '<div class="vc-time" id="vcTime">0:00 / 0:00</div>' +
  '<button class="vc-btn" id="vcMute" type="button" aria-label="Mute">' +
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">' +
      '<path id="vcMuteIcon" d="M8 2.5 4.5 5.5H2v5h2.5L8 13.5zM11 5.8a3 3 0 0 1 0 4.4"' +
      ' stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<path d="M8 2.5 4.5 5.5H2v5h2.5L8 13.5z"/></svg></button>' +
  '<input type="range" class="vc-vol" id="vcVol" min="0" max="1" step="0.05" value="1" aria-label="Volume">';

video.parentNode.appendChild(bar);

const elPlay    = bar.querySelector("#vcPlay");
const elPlayIcn = bar.querySelector("#vcPlayIcon");
const elSeek    = bar.querySelector("#vcSeek");
const elWatched = bar.querySelector("#vcWatched");
const elPlayed  = bar.querySelector("#vcPlayed");
const elKnob    = bar.querySelector("#vcKnob");
const elTime    = bar.querySelector("#vcTime");
const elMute    = bar.querySelector("#vcMute");
const elVol     = bar.querySelector("#vcVol");

const PLAY_PATH  = "M4 2.5v11l9-5.5z";
const PAUSE_PATH = "M4 2.5h3v11H4zM9 2.5h3v11H9z";

function fmt(t) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return m + ":" + String(s).padStart(2, "0");
}

elPlay.addEventListener("click", () => {
  if (video.paused) video.play().catch(() => {});
  else video.pause();
});

video.addEventListener("play",  () => { elPlayIcn.setAttribute("d", PAUSE_PATH); elPlay.setAttribute("aria-label", "Pause"); });
video.addEventListener("pause", () => { elPlayIcn.setAttribute("d", PLAY_PATH);  elPlay.setAttribute("aria-label", "Play");  });

elMute.addEventListener("click", () => {
  video.muted = !video.muted;
  elMute.setAttribute("aria-label", video.muted ? "Unmute" : "Mute");
  elMute.classList.toggle("muted", video.muted);
  elVol.value = video.muted ? 0 : video.volume;
});

elVol.addEventListener("input", () => {
  video.volume = parseFloat(elVol.value);
  video.muted  = video.volume === 0;
  elMute.classList.toggle("muted", video.muted);
});

// ─── Seeking, bounded by what has actually been watched ──────────
// The learner may scrub back over anything already seen, but not past
// it. Clamping the target here means the bar simply won't go further,
// instead of jumping ahead and snapping back.
function seekTo(seconds) {
  const limit = Math.min(maxWatched, video.duration || 0);
  video.currentTime = Math.max(0, Math.min(seconds, limit));
}

function seekFromPointer(clientX) {
  const r = elSeek.getBoundingClientRect();
  if (!r.width || !video.duration) return;
  seekTo(((clientX - r.left) / r.width) * video.duration);
}

let scrubbing = false;

elSeek.addEventListener("pointerdown", e => {
  scrubbing = true;
  elSeek.setPointerCapture(e.pointerId);
  seekFromPointer(e.clientX);
});

elSeek.addEventListener("pointermove", e => { if (scrubbing) seekFromPointer(e.clientX); });

elSeek.addEventListener("pointerup", e => {
  scrubbing = false;
  try { elSeek.releasePointerCapture(e.pointerId); } catch (err) {}
});

elSeek.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    seekTo(video.currentTime + (e.key === "ArrowRight" ? PLAYER_CONFIG.seekStep : -PLAYER_CONFIG.seekStep));
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    elPlay.click();
  }
});

// ─── Seek-forward lock ───────────────────────────────────────────
// The bar above can't overshoot, but the media element can still be
// seeked by other routes (keyboard media keys, a resume, script), so
// the ceiling is enforced on the element too.
//
// No "am I already correcting?" flag: such a flag has to be cleared on
// 'seeked', which leaves the lock open for as long as the correction is
// in flight, and a burst of scrub clicks lands inside that window. The
// comparison is self-limiting instead — the correction seeks to
// maxWatched, which fails the test, so it never recurses.
function clampSeek() {
  if (video.currentTime > maxWatched + 1.5) video.currentTime = maxWatched;
}

video.addEventListener("seeking", clampSeek);
video.addEventListener("seeked",  clampSeek);

// ─── Resume from bookmark ────────────────────────────────────────
video.addEventListener("loadedmetadata", () => {
  const saved = (typeof scormGetLocation === "function") ? scormGetLocation() : 0;
  if (saved > 5 && saved < video.duration - 5) {
    maxWatched        = saved;   // set first — the seek lock reads it
    lastBookmark      = saved;
    playedSeconds     = saved;   // credit time already watched in an earlier session
    video.currentTime = saved;
  }
  render();
});

// ─── Real watched-time accumulator ───────────────────────────────
// Completion needs real seconds spent playing, not just a position on
// the timeline. Position alone is what let a sped-up video "finish" the
// course early; wall-clock time can't be shortcut that way, whatever
// route someone finds to change the rate.
function tick() {
  const now = Date.now();
  if (!video.paused && !video.seeking && lastTick !== null) {
    const delta = (now - lastTick) / 1000;
    if (delta > 0 && delta < 2) playedSeconds += delta;   // ignore tab-throttled gaps
  }
  lastTick = now;
}

setInterval(tick, 250);
video.addEventListener("play",  () => { lastTick = Date.now(); });
video.addEventListener("pause", tick);

// ─── Progress + completion ───────────────────────────────────────
video.addEventListener("timeupdate", () => {
  // Never let a seek in flight advance the furthest-watched mark.
  if (!video.seeking && video.currentTime > maxWatched) maxWatched = video.currentTime;

  render();

  // Bookmark every 10s. timeupdate fires ~4x/sec, so guard on the last
  // saved position — an LMS Commit per event would hammer SAP needlessly.
  if (typeof scormSetLocation === "function" && video.currentTime - lastBookmark >= 10) {
    lastBookmark = video.currentTime;
    scormSetLocation(video.currentTime);
  }

  checkComplete();
});

video.addEventListener("ended", () => { tick(); checkComplete(); });

function watchedEnough() {
  if (!video.duration) return false;
  return maxWatched >= video.duration * PLAYER_CONFIG.completeAt &&
         playedSeconds >= video.duration * PLAYER_CONFIG.minWatchRatio;
}

function checkComplete() {
  if (videoComplete || !watchedEnough()) return;
  videoComplete = true;
  video.pause();
  if (typeof window.onVideoComplete === "function") window.onVideoComplete();
}

function render() {
  const d = video.duration || 0;
  const pctPlayed  = d ? (video.currentTime / d) * 100 : 0;
  const pctWatched = d ? Math.min(100, (maxWatched / d) * 100) : 0;

  elPlayed.style.width  = pctPlayed.toFixed(2) + "%";
  elWatched.style.width = pctWatched.toFixed(2) + "%";
  elKnob.style.left     = pctPlayed.toFixed(2) + "%";
  elTime.textContent    = fmt(video.currentTime) + " / " + fmt(d);

  elSeek.setAttribute("aria-valuemax", Math.floor(d));
  elSeek.setAttribute("aria-valuenow", Math.floor(video.currentTime));
  elSeek.setAttribute("aria-valuetext", fmt(video.currentTime) + " of " + fmt(d));
}

// ─── Pause when the learner switches tab / minimises ─────────────
let awayTimer = null;
let pausedByVisibility = false;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (!video.paused && !videoComplete) {
      video.pause();
      pausedByVisibility = true;
    }
    awayTimer = setTimeout(() => {
      if (typeof markIncomplete === "function") markIncomplete();
    }, 5000);
  } else {
    clearTimeout(awayTimer);
    const blocked = typeof window.playerResumeBlocked === "function" && window.playerResumeBlocked();
    if (pausedByVisibility && !videoComplete && !blocked) {
      pausedByVisibility = false;
      video.play().catch(() => {});
    } else {
      pausedByVisibility = false;
    }
  }
});

// ─── Reset (course relaunch) ─────────────────────────────────────
function resetPlayer() {
  maxWatched    = 0;
  playedSeconds = 0;
  lastBookmark  = 0;
  videoComplete = false;
  lastTick      = null;
  video.currentTime = 0;   // a rewind — the seek lock allows it
  render();
}

function playerState() {
  return { maxWatched: maxWatched, playedSeconds: playedSeconds, complete: videoComplete };
}
