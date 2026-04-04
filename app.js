const video = document.getElementById("video");

// ─── Prevent Skipping ────────────────────────────────────────────
let lastTime = 0;
video.addEventListener("timeupdate", () => {
  if (video.currentTime > lastTime + 1) {
    video.currentTime = lastTime;
  }
  lastTime = video.currentTime;
  handleQuiz(video.currentTime);
});

// ─── Quiz Data ───────────────────────────────────────────────────
// Each section: triggerTime (seconds), sectionStart (replay point), questions array
const quizSections = [
  {
    triggerTime: 45,
    sectionStart: 0,      // fail hone par video 0s se replay
    questions: [
      {
        text: "After logging into the DASH Portal, where do you click to navigate to the Purchase Order section?",
        options: [
          "Top navigation bar",
          "Left side pane",
          "Centre of the Home Page",
          "Search bar at the top"
        ],
        correctIndex: 1   // B – Left side pane
      }
    ]
  },
  {
    triggerTime: 90,
    sectionStart: 45,     // fail hone par video 45s se replay (Q1 ke baad se)
    questions: [
      {
        text: "What is the status of a Purchase Order immediately after it is created?",
        options: [
          "Confirmed",
          "Credit Check",
          "Fulfilled",
          "Draft"
        ],
        correctIndex: 3   // D – Draft
      }
    ]
  },
  {
    triggerTime: 135,
    sectionStart: 90,     // fail hone par video 90s se replay (Q2 ke baad se)
    questions: [
      {
        text: "When creating a New Purchase Order, which two fields must you fill in before saving?",
        options: [
          "Product Name & Quantity",
          "Payment Term & Ship-To Address"
        ],
        correctIndex: 1   // B – Payment Term & Ship-To Address
      }
    ]
  }
  // Add more sections here as needed
];

// ─── State ───────────────────────────────────────────────────────
let triggered        = {};   // tracks which triggerTimes have fired
let currentSection   = null;
let currentQIndex    = 0;
let attemptsLeft     = 2;
let selectedOption   = null;

// ─── Trigger Logic ───────────────────────────────────────────────
function handleQuiz(currentTime) {
  const t = Math.floor(currentTime);
  quizSections.forEach((section) => {
    if (t >= section.triggerTime && !triggered[section.triggerTime]) {
      triggered[section.triggerTime] = true;
      video.pause();
      startSection(section);
    }
  });
}

function startSection(section) {
  currentSection = section;
  currentQIndex  = 0;
  showQuestion();
}

// ─── Question Display ─────────────────────────────────────────────
function showQuestion() {
  const q = currentSection.questions[currentQIndex];
  attemptsLeft   = 2;
  selectedOption = null;

  const total = currentSection.questions.length;
  document.getElementById("questionNumber").textContent =
    "Question " + (currentQIndex + 1) + " of " + total;
  document.getElementById("questionText").textContent = q.text;

  buildOptions(q.options);
  hideFeedback();
  updateAttemptDots();

  const btn = document.getElementById("submitBtn");
  btn.disabled    = true;
  btn.textContent = "Submit Answer";

  document.getElementById("quizOverlay").classList.add("active");
}

function buildOptions(options) {
  const container = document.getElementById("optionsContainer");
  container.innerHTML = "";
  const labels = ["A", "B", "C", "D"];

  options.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.dataset.index = i;
    btn.innerHTML =
      '<span class="option-label">' + labels[i] + '</span>' +
      '<span class="option-text">'  + text       + '</span>';
    btn.addEventListener("click", () => selectOption(i));
    container.appendChild(btn);
  });
}

// ─── Option Selection ─────────────────────────────────────────────
function selectOption(index) {
  if (selectedOption === index) return;
  selectedOption = index;

  document.querySelectorAll(".option-btn").forEach((btn, i) => {
    btn.classList.toggle("selected", i === index);
  });
  document.getElementById("submitBtn").disabled = false;
}

// ─── Attempt Dots ─────────────────────────────────────────────────
function updateAttemptDots() {
  const indicator = document.getElementById("attemptIndicator");
  indicator.innerHTML = "";
  const total = 2;
  const used  = total - attemptsLeft;

  for (let i = 0; i < total; i++) {
    const dot = document.createElement("div");
    dot.className = "attempt-dot";
    if      (i < used)  dot.classList.add("used");
    else if (i === used) dot.classList.add("active");
    indicator.appendChild(dot);
  }
}

// ─── Submit Answer ────────────────────────────────────────────────
function submitAnswer() {
  if (selectedOption === null) return;

  const q         = currentSection.questions[currentQIndex];
  const isCorrect = selectedOption === q.correctIndex;
  const allBtns   = document.querySelectorAll(".option-btn");

  // Lock all options while processing
  allBtns.forEach(btn => (btn.disabled = true));
  document.getElementById("submitBtn").disabled = true;

  if (isCorrect) {
    allBtns[selectedOption].classList.add("correct");
    showFeedback("success", "✓  Correct! Well done.");

    setTimeout(() => {
      currentQIndex++;
      if (currentQIndex < currentSection.questions.length) {
        showQuestion();                 // next question in this section
      } else {
        closeQuiz();
        video.play();                  // all questions done — resume video
      }
    }, 1300);

  } else {
    allBtns[selectedOption].classList.add("wrong");

    const isBooleanQuestion = q.options.length <= 2;

    if (!isBooleanQuestion) {
      attemptsLeft--;
      updateAttemptDots();
    }

    if (!isBooleanQuestion && attemptsLeft > 0) {
      // ── MCQ: still has a retry ──────────────────────────────────
      showFeedback(
        "error",
        "✗  Incorrect. You have " + attemptsLeft +
          " retry remaining. Please try again."
      );

      const card = document.getElementById("quizCard");
      card.classList.add("shake");
      card.addEventListener("animationend", () => card.classList.remove("shake"), { once: true });

      setTimeout(() => {
        allBtns.forEach((btn, i) => {
          btn.disabled = false;
          btn.classList.remove("selected");
          if (i === selectedOption) btn.classList.add("wrong");
        });
        selectedOption = null;
        document.getElementById("submitBtn").disabled = true;
        hideFeedback();
      }, 1100);

    } else {
      // ── Boolean question (no retry) OR MCQ retries exhausted ────
      // Correct answer sirf boolean me highlight karo, MCQ me nahi
      if (isBooleanQuestion) allBtns[q.correctIndex].classList.add("correct");
      const msg = isBooleanQuestion
        ? "✗  Incorrect. The correct answer is highlighted above. Replaying this section."
        : "✗  Incorrect again. The correct answer is highlighted above.\n" +
            "Replaying this section from the beginning so you can review the content.";
      showFeedback("warning", msg);

      setTimeout(() => {
        closeQuiz();
        replaySection(currentSection);
      }, 2500);
    }
  }
}

// ─── Section Replay ───────────────────────────────────────────────
function replaySection(section) {
  triggered[section.triggerTime] = false;   // allow quiz to fire again
  lastTime = section.sectionStart;
  video.currentTime = section.sectionStart;
  video.play();
}

// ─── Helpers ──────────────────────────────────────────────────────
function closeQuiz() {
  document.getElementById("quizOverlay").classList.remove("active");
}

function showFeedback(type, message) {
  const banner = document.getElementById("feedbackBanner");
  banner.className = "feedback-banner " + type;
  banner.textContent = message;
}

function hideFeedback() {
  const banner = document.getElementById("feedbackBanner");
  banner.className = "feedback-banner hidden";
  banner.textContent = "";
}

// ─── Completion ───────────────────────────────────────────────────
video.addEventListener("ended", () => {
  if (typeof markComplete === "function") markComplete();
});

// ─── Visibility / Focus Guard ─────────────────────────────────────
let awayTimer = null;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    awayTimer = setTimeout(() => {
      if (typeof markIncomplete === "function") markIncomplete();
    }, 5000);
  } else {
    clearTimeout(awayTimer);
  }
});
