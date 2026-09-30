// ─────────────────────────────────────────────────────────────────
//  End-of-module assessment engine
//
//  Shared by the quiz-bearing modules so the rules live in one file and
//  each course only supplies its question pool and its numbers. Nothing
//  here is course-specific; everything that varies is in QUIZ_CONFIG.
//
//  Expects, from the page:
//    QUESTION_POOL   — see the module's questions.js
//    QUIZ_CONFIG     — deliverCount, passPercent, maxAttempts, …
//    player.js       — calls window.onVideoComplete() once the video is
//                      genuinely watched
//    scorm.js        — reporting helpers
// ─────────────────────────────────────────────────────────────────

let quizSet        = [];
let currentQIndex  = 0;
let correctCount   = 0;
let selectedOption = null;
let answered       = false;    // this question is closed out
let triesLeft      = 0;
let triesTotal     = 0;
let quizStarted    = false;
let attemptNo      = 0;        // 1-based, counts this learner's quiz attempts

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** N questions from the pool, each with its options in a fresh order. */
function buildQuizSet() {
  const picked = QUIZ_CONFIG.shuffleQuestions ? shuffle(QUESTION_POOL) : QUESTION_POOL.slice();
  return picked.slice(0, QUIZ_CONFIG.deliverCount).map(q => {
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

// ─── Attempts ────────────────────────────────────────────────────
// Kept in the LMS, not just in memory: an attempt limit that resets when
// the learner closes the window and opens it again is not a limit.
function attemptsUsed() {
  return (typeof scormGetAttempts === "function") ? scormGetAttempts() : 0;
}

function attemptsLeft() {
  return Math.max(0, QUIZ_CONFIG.maxAttempts - attemptsUsed());
}

// ─── Entry point ─────────────────────────────────────────────────
// player.js calls this once the video has actually been watched.
window.onVideoComplete = function () {
  if (quizStarted) return;
  quizStarted = true;
  if (typeof scormSetLocation === "function") scormSetLocation(0);
  document.querySelector(".video-container").classList.add("quiz-mode");
  showIntro();
};

// player.js asks before auto-resuming after a tab switch.
window.playerResumeBlocked = function () {
  return quizStarted;
};

function showIntro() {
  const left = attemptsLeft();
  document.getElementById("introAttempts").textContent = left === QUIZ_CONFIG.maxAttempts
    ? QUIZ_CONFIG.maxAttempts + " attempts in total"
    : left + " of " + QUIZ_CONFIG.maxAttempts + " attempts remaining";

  const startBtn = document.getElementById("startBtn");
  if (left === 0) {
    // Nothing left to start. Say so here rather than letting them begin a
    // quiz whose result cannot count.
    startBtn.classList.add("hidden");
    document.getElementById("introExhausted").classList.remove("hidden");
  }
  document.getElementById("introScreen").classList.remove("hidden");
}

function startQuiz() {
  if (attemptsLeft() === 0) return;
  attemptNo = attemptsUsed() + 1;
  if (typeof scormSetAttempts === "function") scormSetAttempts(attemptNo);

  quizSet       = buildQuizSet();
  currentQIndex = 0;
  correctCount  = 0;

  document.getElementById("introScreen").classList.add("hidden");
  document.getElementById("resultScreen").classList.add("hidden");
  document.getElementById("quizOverlay").classList.add("active");
  showQuestion();
}

// ─── One question ────────────────────────────────────────────────
function showQuestion() {
  const q = quizSet[currentQIndex];
  selectedOption = null;
  answered       = false;
  triesTotal     = q.options.length >= 3 ? QUIZ_CONFIG.triesPerQuestion : 1;
  triesLeft      = triesTotal;

  document.getElementById("questionNumber").textContent =
    "Question " + (currentQIndex + 1) + " of " + quizSet.length;
  document.getElementById("questionText").textContent = q.text;
  document.getElementById("attemptIndicator").textContent =
    "Attempt " + attemptNo + " of " + QUIZ_CONFIG.maxAttempts;

  buildOptions(q.options);
  hideFeedback();
  updateQuizProgress();

  const btn = document.getElementById("submitBtn");
  btn.disabled    = true;
  btn.textContent = "Submit Answer";
  btn.onclick     = submitAnswer;
}

function buildOptions(options) {
  const container = document.getElementById("optionsContainer");
  container.innerHTML = "";
  const labels = ["A", "B", "C", "D", "E", "F"];

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

function updateQuizProgress() {
  const wrap = document.getElementById("quizDots");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (let i = 0; i < quizSet.length; i++) {
    const dot = document.createElement("div");
    dot.className = "quiz-dot";
    if      (i < currentQIndex)  dot.classList.add("done");
    else if (i === currentQIndex) dot.classList.add("active");
    wrap.appendChild(dot);
  }
}

// ─── Submit ──────────────────────────────────────────────────────
function submitAnswer() {
  if (selectedOption === null || answered) return;

  const q       = quizSet[currentQIndex];
  const correct = selectedOption === q.correctIndex;
  const allBtns = document.querySelectorAll(".option-btn");

  // Lock the card while the feedback shows. Disabling Submit matters as
  // much as the options: without it an impatient double-click re-submits
  // the same answer and spends the remaining tries in one go.
  allBtns.forEach(btn => (btn.disabled = true));
  document.getElementById("submitBtn").disabled = true;

  if (correct) {
    correctCount++;
    answered = true;
    allBtns[selectedOption].classList.add("correct");
    logInteraction(q, selectedOption, true);
    showFeedback("success", "✓  " + q.fbRight);
    closeOutQuestion();
    return;
  }

  triesLeft--;
  allBtns[selectedOption].classList.add("wrong");

  if (triesLeft > 0) {
    // Tries remain — do not reveal the answer, or the retry is pointless.
    selectedOption = null;
    showFeedback("error", "✗  Not correct. You have " + triesLeft +
      (triesLeft === 1 ? " try" : " tries") + " left — try again.");
    setTimeout(() => {
      allBtns.forEach(btn => { if (!btn.classList.contains("wrong")) btn.disabled = false; });
      hideFeedback();
    }, 1200);
    return;
  }

  answered = true;
  logInteraction(q, selectedOption, false);
  if (QUIZ_CONFIG.revealCorrectAfterAnswer) allBtns[q.correctIndex].classList.add("correct");
  showFeedback("warning", "✗  " + q.fbWrong);
  closeOutQuestion();
}

function logInteraction(q, chosen, correct) {
  if (typeof scormLogInteraction === "function") {
    scormLogInteraction(q, chosen, q.correctIndex, correct);
  }
}

function closeOutQuestion() {
  const btn = document.getElementById("submitBtn");
  btn.disabled    = false;
  btn.textContent = (currentQIndex + 1 < quizSet.length) ? "Next Question" : "See Results";
  btn.onclick     = nextQuestion;
  btn.focus();
}

function nextQuestion() {
  currentQIndex++;
  if (currentQIndex < quizSet.length) showQuestion();
  else finishQuiz();
}

// ─── Result ──────────────────────────────────────────────────────
function finishQuiz() {
  document.getElementById("quizOverlay").classList.remove("active");

  const total   = quizSet.length;
  const percent = Math.round((correctCount / total) * 100);
  const passed  = percent >= QUIZ_CONFIG.passPercent;
  const needed  = Math.ceil((QUIZ_CONFIG.passPercent / 100) * total);
  const left    = attemptsLeft();

  // Completion is reported only on a pass. A failed attempt is still a
  // result the LMS should see, but it must not mark the module done.
  if (typeof scormSubmitResult === "function") {
    scormSubmitResult(correctCount, total, passed);
  }

  const screen = document.getElementById("resultScreen");
  screen.classList.remove("hidden", "pass", "fail");
  screen.classList.add(passed ? "pass" : "fail");

  document.getElementById("resultIcon").textContent  = passed ? "✓" : "!";
  document.getElementById("resultScore").textContent =
    correctCount + " / " + total + "  ·  " + percent + "%";

  if (passed) {
    document.getElementById("resultTitle").textContent = "Congratulations — you passed!";
    document.getElementById("resultMsg").textContent =
      "You have completed this module. Your score has been recorded. " +
      "Click below to mark the module complete in SAP Learning.";
  } else if (left > 0) {
    document.getElementById("resultTitle").textContent =
      "You did not reach " + QUIZ_CONFIG.passPercent + "%";
    document.getElementById("resultMsg").textContent =
      "You scored " + percent + "%, below the " + QUIZ_CONFIG.passPercent +
      "% needed to pass (" + needed + " of " + total + " correct). You have " +
      left + (left === 1 ? " attempt" : " attempts") +
      " left — a fresh set of questions is drawn each time.";
  } else {
    document.getElementById("resultTitle").textContent = "No attempts remaining";
    document.getElementById("resultMsg").textContent =
      "You scored " + percent + "%, below the " + QUIZ_CONFIG.passPercent +
      "% needed to pass. All " + QUIZ_CONFIG.maxAttempts +
      " attempts have been used, so this module stays incomplete. " +
      "Please contact your training administrator.";
  }

  // Only a pass offers "Mark as Complete" — the button must never be a way
  // to close a failed module as done.
  document.getElementById("passActions").classList.toggle("hidden", !passed);
  document.getElementById("retryActions").classList.toggle("hidden", passed || left === 0);
  document.getElementById("exhaustedActions").classList.toggle("hidden", passed || left > 0);
}

function retryQuiz() {
  startQuiz();
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
