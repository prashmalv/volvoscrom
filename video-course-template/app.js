// ─────────────────────────────────────────────────────────────────
//  Video-only SCORM course player
//  Same playback rules as the Password Hygiene module (seek lock,
//  speed lock, bookmark, tab-switch pause) but with no assessment:
//  the module completes once the video has been watched through.
// ─────────────────────────────────────────────────────────────────
const video = document.getElementById("video");

let completionShown = false;
let maxWatched      = 0;   // furthest point actually reached (rewind allowed)
let lastBookmark    = 0;   // last position written to the LMS

const COMPLETE_AT = 0.95;  // count the video as viewed at 95%

// ─── Playback speed lock ─────────────────────────────────────────
// controlsList="noplaybackrate" only hides Chrome's speed menu. Safari
// on macOS ignores controlsList altogether and offers its own speed
// control, which would let a learner finish the module at 2x. Browser
// chrome can't be relied on, so pin the rate on the element itself.
video.defaultPlaybackRate = 1;

video.addEventListener("ratechange", () => {
  // Self-limiting: the assignment re-fires ratechange, but by then the
  // rate is already 1 and the branch is skipped.
  if (video.playbackRate !== 1) video.playbackRate = 1;
});

// ─── Resume from bookmark ────────────────────────────────────────
video.addEventListener("loadedmetadata", () => {
  const saved = (typeof scormGetLocation === "function") ? scormGetLocation() : 0;
  if (saved > 5 && saved < video.duration - 5) {
    maxWatched        = saved;   // set first — the seek lock reads it
    lastBookmark      = saved;
    video.currentTime = saved;
  }
});

// ─── Seek-forward lock (rewind and re-watch stay allowed) ────────
// Driven by the 'seeking' event, not by timeupdate gaps: a buffering
// stall can gap timeupdate by over a second, and inferring a skip from
// that would yank an honest learner backwards.
//
// No "am I already correcting?" flag here. Such a flag has to be cleared
// on 'seeked', which leaves the lock open for as long as our own
// correction is in flight — and a learner clicking the scrub bar a few
// times in a row lands a seek inside that window and sails straight
// past. The comparison below is self-limiting instead: the correction
// seeks to maxWatched, which fails the test, so it never recurses.
function clampSeek() {
  if (video.currentTime > maxWatched + 1.5) {
    video.currentTime = maxWatched;
  }
}

video.addEventListener("seeking", clampSeek);

// Second line of defence, for seeks that settle past the ceiling anyway
// (coalesced events, or a browser that fires 'seeking' once for a burst).
video.addEventListener("seeked", clampSeek);

// ─── Progress ────────────────────────────────────────────────────
video.addEventListener("timeupdate", () => {
  // Never let a seek in flight advance the furthest-watched mark.
  if (!video.seeking && video.currentTime > maxWatched) maxWatched = video.currentTime;

  updateProgress();

  // Bookmark every 10s. timeupdate fires ~4x/sec, so guard on the last
  // saved position — an LMS Commit per event would hammer SAP needlessly.
  if (typeof scormSetLocation === "function" && video.currentTime - lastBookmark >= 10) {
    lastBookmark = video.currentTime;
    scormSetLocation(video.currentTime);
  }

  // Fallback: some LMS iframes swallow the 'ended' event.
  if (!completionShown && video.duration &&
      maxWatched >= video.duration * COMPLETE_AT) {
    showCompletion();
  }
});

video.addEventListener("ended", showCompletion);

function updateProgress() {
  if (!video.duration) return;
  const bar = document.getElementById("progressFill");
  if (bar) bar.style.width = Math.min(100, (maxWatched / video.duration) * 100).toFixed(1) + "%";
}

// ─── Completion ──────────────────────────────────────────────────
function showCompletion() {
  if (completionShown) return;
  completionShown = true;
  video.pause();
  if (typeof scormSetLocation === "function") scormSetLocation(0);
  if (typeof markComplete === "function") markComplete();
  document.getElementById("completionScreen").classList.remove("hidden");
}

// ─── Fullscreen ──────────────────────────────────────────────────
const playerWrapper = document.getElementById("playerWrapper");

function toggleFullscreen() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fsEl) {
    const req = playerWrapper.requestFullscreen || playerWrapper.webkitRequestFullscreen;
    if (req) req.call(playerWrapper);
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document);
  }
}

document.addEventListener("fullscreenchange", updateFsIcon);
document.addEventListener("webkitfullscreenchange", updateFsIcon);

function updateFsIcon() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  const icon = document.getElementById("fsIcon");
  if (!icon) return;
  icon.innerHTML = isFs
    ? '<path d="M5.5 0h-4v4h1.5v-2.5h2.5v-1.5zm5 0h4v4h-1.5v-2.5h-2.5v-1.5zm-5 16h-4v-4h1.5v2.5h2.5v1.5zm9-4h-1.5v2.5h-2.5v1.5h4v-4z"/>'
    : '<path d="M1.5 1h4v1.5h-2.5v2.5h-1.5v-4zm9 0h4v4h-1.5v-2.5h-2.5v-1.5zm-9 9h1.5v2.5h2.5v1.5h-4v-4zm11.5 2.5v-2.5h1.5v4h-4v-1.5h2.5z"/>';
}

// ─── Pause when the learner switches tab / minimises ─────────────
let awayTimer = null;
let pausedByVisibility = false;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (!video.paused && !completionShown) {
      video.pause();
      pausedByVisibility = true;
    }
    awayTimer = setTimeout(() => {
      if (typeof markIncomplete === "function") markIncomplete();
    }, 5000);
  } else {
    clearTimeout(awayTimer);
    if (pausedByVisibility && !completionShown) {
      pausedByVisibility = false;
      video.play().catch(() => {});
    } else {
      pausedByVisibility = false;
    }
  }
});
