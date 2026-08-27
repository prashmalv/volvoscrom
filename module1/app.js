// ─────────────────────────────────────────────────────────────────
//  VCPL · Course 1 / Module 1 — Password Hygiene
//  Video first, then a 5-question END-of-module assessment drawn at
//  random from the 11-question pool in questions.js.
// ─────────────────────────────────────────────────────────────────
const video = document.getElementById("video");

let videoWatched   = false;   // ≥95% viewed
let quizStarted    = false;
let maxWatched     = 0;       // furthest point actually reached (rewind allowed)
let lastBookmark   = 0;       // last position written to the LMS

// ─── Playback speed lock ─────────────────────────────────────────
// controlsList="noplaybackrate" only hides Chrome's speed menu. Safari
// on macOS ignores controlsList altogether and offers speed control in
// its own menu, which let learners run the module at 2x and "finish" it
// in half the time. Browser chrome can't be relied on, so pin the rate
// on the element itself — that holds whatever UI, shortcut or extension
// tries to change it.
video.defaultPlaybackRate = 1;

video.addEventListener("ratechange", () => {
  // Self-limiting: the assignment fires ratechange again, but the rate
  // is already 1 by then and the branch is skipped.
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
// No "am I already correcting?" flag here. A flag like that has to be
// cleared on 'seeked', which leaves the lock open for the whole time our
// own correction is in flight — and a learner clicking the scrub bar a
// few times in a row lands a seek inside that window and sails straight
// past. The comparison below is self-limiting instead: our correction
// seeks to maxWatched, which fails the test, so it never recurses.
function clampSeek() {
  if (video.currentTime > maxWatched + 1.5) {
    video.currentTime = maxWatched;
    return true;
  }
  return false;
}

video.addEventListener("seeking", clampSeek);

// Second line of defence: if a seek settles past the ceiling anyway —
// coalesced events, a browser that fires 'seeking' only once for a burst —
// pull it back once it has landed.
video.addEventListener("seeked", clampSeek);

video.addEventListener("timeupdate", () => {
  // Never let a seek in flight advance the furthest-watched mark.
  if (!video.seeking && video.currentTime > maxWatched) maxWatched = video.currentTime;

  updateProgress();

  if (!videoWatched && video.duration &&
      maxWatched >= video.duration * QUIZ_CONFIG.videoCompleteAt) {
    videoWatched = true;
  }

  // Bookmark every 10s. timeupdate fires ~4x/sec, so guard on the last
  // saved position — an LMS Commit per event would hammer SAP needlessly.
  if (typeof scormSetLocation === "function" && video.currentTime - lastBookmark >= 10) {
    lastBookmark = video.currentTime;
    scormSetLocation(video.currentTime);
  }

  // Fallback: some LMS iframes swallow the 'ended' event
  if (!quizStarted && video.duration && video.currentTime >= video.duration - 0.5) {
    beginAssessment();
  }
});

video.addEventListener("ended", beginAssessment);

function updateProgress() {
  if (!video.duration) return;
  const pct = Math.min(100, (maxWatched / video.duration) * 100);
  const bar = document.getElementById("progressFill");
  if (bar) bar.style.width = pct.toFixed(1) + "%";
}

// ─── Assessment state ────────────────────────────────────────────
let quizSet       = [];   // the 5 delivered questions, options already shuffled
let currentQIndex = 0;
let correctCount  = 0;
let selectedOption = null;
let answered       = false;   // question closed out, waiting for Next
let triesLeft      = 0;       // tries remaining on the current question
let triesTotal     = 0;
let firstTry       = true;    // is this submit the question's first answer?
let courseAttempt  = 1;       // incremented each time the course is relaunched

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick N random questions and shuffle each question's options.
function buildQuizSet() {
  return shuffle(QUESTION_POOL)
    .slice(0, QUIZ_CONFIG.deliverCount)
    .map(q => {
      const opts = QUIZ_CONFIG.shuffleOptions ? shuffle(q.options) : q.options.slice();
      return {
        id: q.id,
        lo: q.lo,
        text: q.text,
        options: opts,
        correctIndex: opts.findIndex(o => o.correct),
        fbRight: q.fbRight,
        fbWrong: q.fbWrong
      };
    });
}

// ─── Assessment intro ────────────────────────────────────────────
function beginAssessment() {
  if (quizStarted) return;
  quizStarted = true;
  videoWatched = true;              // reaching the end counts as viewed
  video.pause();
  if (typeof scormSetLocation === "function") scormSetLocation(0);
  document.querySelector(".video-container").classList.add("quiz-mode");
  document.getElementById("introScreen").classList.remove("hidden");
}

function startQuiz() {
  quizSet       = buildQuizSet();
  currentQIndex = 0;
  correctCount  = 0;

  document.getElementById("introScreen").classList.add("hidden");
  document.getElementById("resultScreen").classList.add("hidden");
  document.getElementById("quizOverlay").classList.add("active");
  showQuestion();
}

// ─── Question display ────────────────────────────────────────────
function showQuestion() {
  const q = quizSet[currentQIndex];
  selectedOption = null;
  answered       = false;
  firstTry       = true;

  // Two-option questions get a single try — there is nothing to narrow down.
  triesTotal = q.options.length >= 3 ? QUIZ_CONFIG.maxAttempts : 1;
  triesLeft  = triesTotal;

  document.getElementById("questionNumber").textContent =
    "Question " + (currentQIndex + 1) + " of " + quizSet.length;
  document.getElementById("questionText").textContent = q.text;

  buildOptions(q.options);
  hideFeedback();
  updateQuizProgress();
  updateTryDots();

  const btn = document.getElementById("submitBtn");
  btn.disabled    = true;
  btn.textContent = "Submit Answer";
  btn.onclick     = submitAnswer;
}

function buildOptions(options) {
  const container = document.getElementById("optionsContainer");
  container.innerHTML = "";
  const labels = ["A", "B", "C", "D", "E"];

  options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.type = "button";
    btn.dataset.index = i;
    btn.setAttribute("aria-label", labels[i] + ". " + opt.t);
    btn.innerHTML =
      '<span class="option-label">' + labels[i] + '</span>' +
      '<span class="option-text"></span>';
    btn.querySelector(".option-text").textContent = opt.t;
    btn.addEventListener("click", () => selectOption(i));
    container.appendChild(btn);
  });
}

function selectOption(index) {
  if (answered || selectedOption === index) return;
  selectedOption = index;
  document.querySelectorAll(".option-btn").forEach((btn, i) => {
    btn.classList.toggle("selected", i === index);
  });
  document.getElementById("submitBtn").disabled = false;
}

// Dots in the card header: one per try, spent ones turn red.
function updateTryDots() {
  const wrap = document.getElementById("attemptIndicator");
  if (!wrap) return;
  wrap.innerHTML = "";
  const used = triesTotal - triesLeft;
  for (let i = 0; i < triesTotal; i++) {
    const dot = document.createElement("div");
    dot.className = "attempt-dot";
    if      (i < used)   dot.classList.add("used");
    else if (i === used) dot.classList.add("active");
    wrap.appendChild(dot);
  }
  wrap.setAttribute("aria-label", triesLeft + " of " + triesTotal + " tries remaining");
}

function updateQuizProgress() {
  const wrap = document.getElementById("quizDots");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (let i = 0; i < quizSet.length; i++) {
    const dot = document.createElement("div");
    dot.className = "quiz-dot";
    if (i < currentQIndex)       dot.classList.add("done");
    else if (i === currentQIndex) dot.classList.add("active");
    wrap.appendChild(dot);
  }
}

// ─── Submit / feedback ───────────────────────────────────────────
function submitAnswer() {
  if (selectedOption === null || answered) return;

  const q       = quizSet[currentQIndex];
  const correct = selectedOption === q.correctIndex;
  const allBtns = document.querySelectorAll(".option-btn");

  // Only the first answer is scored and logged to the LMS. Retries are a
  // teaching aid, not a second chance at the mark.
  if (firstTry) {
    if (correct) correctCount++;
    if (typeof scormLogInteraction === "function") {
      scormLogInteraction(q, selectedOption, q.correctIndex, correct);
    }
    firstTry = false;
  }

  // Lock the whole card while the feedback shows. Without disabling Submit
  // too, an impatient double-click would re-submit the same wrong answer
  // and burn the remaining tries in one go.
  allBtns.forEach(btn => (btn.disabled = true));
  document.getElementById("submitBtn").disabled = true;

  if (correct) {
    answered = true;
    allBtns[selectedOption].classList.add("correct");
    showFeedback("success", "✓  " + q.fbRight);
    closeOutQuestion();
    return;
  }

  // ── Wrong answer ───────────────────────────────────────────────
  triesLeft--;
  allBtns[selectedOption].classList.add("wrong");
  updateTryDots();

  const card = document.getElementById("quizCard");
  card.classList.add("shake");
  card.addEventListener("animationend", () => card.classList.remove("shake"), { once: true });

  if (triesLeft > 0) {
    // Tries remain — do NOT reveal the correct answer, or the retry is
    // pointless. Just retire the option they already spent.
    selectedOption = null;   // clear now, not just when the options re-enable
    showFeedback(
      "error",
      "✗  Not correct. You have " + triesLeft +
        (triesLeft === 1 ? " try" : " tries") + " left — try again."
    );

    setTimeout(() => {
      allBtns.forEach(btn => {
        if (!btn.classList.contains("wrong")) btn.disabled = false;
      });
      hideFeedback();
    }, 1200);
    return;
  }

  // ── Out of tries — now show the answer and the remediation ─────
  answered = true;
  allBtns[q.correctIndex].classList.add("correct");
  showFeedback("warning", "✗  Out of tries. The correct answer is highlighted above.\n" + q.fbWrong);
  closeOutQuestion();
}

// Turn the Submit button into the Next / See Results control.
function closeOutQuestion() {
  const btn = document.getElementById("submitBtn");
  btn.disabled    = false;
  btn.textContent = (currentQIndex + 1 < quizSet.length) ? "Next Question" : "See Results";
  btn.onclick     = nextQuestion;
  btn.focus();
}

function nextQuestion() {
  currentQIndex++;
  if (currentQIndex < quizSet.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
}

// ─── Results ─────────────────────────────────────────────────────
function finishQuiz() {
  document.getElementById("quizOverlay").classList.remove("active");

  const total   = quizSet.length;
  const scaled  = correctCount / total;
  const percent = Math.round(scaled * 100);
  const passed  = scaled >= QUIZ_CONFIG.passRatio;
  const needed  = Math.ceil(QUIZ_CONFIG.passRatio * total);
  const passPct = Math.round(QUIZ_CONFIG.passRatio * 100);

  // Report the attempt either way — a failed attempt is still a result
  // SAP Learning should see.
  if (typeof scormSubmitResult === "function") {
    scormSubmitResult(correctCount, total, videoWatched);
  }

  const screen = document.getElementById("resultScreen");
  screen.classList.remove("hidden", "pass", "fail");
  screen.classList.add(passed ? "pass" : "fail");

  document.getElementById("resultIcon").textContent  = passed ? "✓" : "!";
  document.getElementById("resultTitle").textContent =
    passed ? "Congratulations — you passed!"
           : "You did not pass the " + passPct + "% score";
  document.getElementById("resultScore").textContent =
    correctCount + " / " + total + "  ·  " + percent + "%";
  document.getElementById("resultMsg").textContent = passed
    ? "You have completed Module 1 — Password Hygiene. Your score has been recorded. " +
      "Click below to mark the module complete in SAP Learning."
    : "You scored " + percent + "%, below the " + passPct + "% required to pass " +
      "(" + needed + " of " + total + " correct). The course will start again from the " +
      "beginning — watch the module through, then take a fresh set of questions.";

  document.getElementById("passActions").classList.toggle("hidden", !passed);
  document.getElementById("failActions").classList.toggle("hidden", passed);
}

// ─── Relaunch after a failed attempt ─────────────────────────────
// Full reset: the learner re-watches the module before a new assessment.
function relaunchCourse() {
  courseAttempt++;

  document.getElementById("resultScreen").classList.add("hidden");
  document.getElementById("introScreen").classList.add("hidden");
  document.getElementById("quizOverlay").classList.remove("active");
  document.querySelector(".video-container").classList.remove("quiz-mode");

  quizStarted   = false;
  videoWatched  = false;
  quizSet       = [];
  currentQIndex = 0;
  correctCount  = 0;
  maxWatched    = 0;     // reset before the seek, so the lock re-arms
  lastBookmark  = 0;

  if (typeof markIncomplete === "function") markIncomplete();
  if (typeof scormSetLocation === "function") scormSetLocation(0);

  video.currentTime = 0;   // a rewind — the seek lock allows it
  video.play().catch(() => {});
}

// ─── Feedback banner ─────────────────────────────────────────────
function showFeedback(type, message) {
  const banner = document.getElementById("feedbackBanner");
  banner.className   = "feedback-banner " + type;
  banner.textContent = message;
}

function hideFeedback() {
  const banner = document.getElementById("feedbackBanner");
  banner.className   = "feedback-banner hidden";
  banner.textContent = "";
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
    if (!video.paused && !quizStarted) {
      video.pause();
      pausedByVisibility = true;
    }
    awayTimer = setTimeout(() => {
      if (typeof markIncomplete === "function") markIncomplete();
    }, 5000);
  } else {
    clearTimeout(awayTimer);
    if (pausedByVisibility && !quizStarted) {
      pausedByVisibility = false;
      video.play().catch(() => {});
    } else {
      pausedByVisibility = false;
    }
  }
});
