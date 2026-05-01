const video = document.getElementById("video");

// ─── Prevent Skipping ────────────────────────────────────────────
let lastTime = 0;
let completionShown = false;
let videoStarted = false;  // skip-prevention only after video actually starts playing

video.addEventListener("playing", () => { videoStarted = true; });

video.addEventListener("timeupdate", () => {
  // Apply skip-prevention only after video has begun playing (not during initial load/buffering)
  if (videoStarted && video.currentTime > lastTime + 1) {
    video.currentTime = lastTime;
  }
  lastTime = video.currentTime;
  handleQuiz(video.currentTime);

  // Fallback completion: triggers if 'ended' event doesn't fire (LMS iframe quirk)
  if (!completionShown && video.duration && video.currentTime >= video.duration - 2) {
    showThankYou();
  }
});

// ─── Quiz Data ───────────────────────────────────────────────────
// Each section: triggerTime (seconds), sectionStart (replay point), questions array
const quizSections = [
  {
    triggerTime: 67,        // 1:06
    sectionStart: 40,       // fail hone par 0:40 se replay
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
    triggerTime: 93,        // 1:30 — Q2 + Q3 same section
    sectionStart: 67,       // fail hone par 1:07 se replay
    questions: [
      {
        text: "When creating a New Purchase Order, which two fields must you fill in before saving?",
        options: [
          "Product Name & Quantity",
          "SAP Order ID & Credit Check Status",
          "Payment Term & Ship-To Address",
          "Distributor Code & Order Amount"
        ],
        correctIndex: 2   // C – Payment Term & Ship-To Address
      },
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
    triggerTime: 133,       // 2:11 (2*60+11=131, using 133 for buffer)
    sectionStart: 93,       // fail hone par 1:33 se replay
    questions: [
      {
        text: "When adding products, you enter quantity in QTY (Cases). What happens when you press Enter?",
        options: [
          "The product is removed from the list",
          "The PO is automatically submitted",
          "QTY (PCS) – quantity in pieces – is auto-calculated",
          "A credit check is triggered immediately"
        ],
        correctIndex: 2   // C – QTY (PCS) is auto-calculated
      }
    ]
  },
  {
    triggerTime: 149,       // 2:29
    sectionStart: 133,      // fail hone par 2:13 se replay
    questions: [
      {
        text: "What action do you take to officially submit a completed Purchase Order?",
        options: [
          "Click 'Confirm Order'",
          "Click 'Mark Status as Complete'",
          "Click 'Save & New'",
          "Click 'Submit to SAP'"
        ],
        correctIndex: 1   // B – Mark Status as Complete
      }
    ]
  },
  {
    triggerTime: 189,       // 3:09
    sectionStart: 151,      // fail hone par 2:31 se replay
    questions: [
      {
        text: "If the Credit Check Status shows 'Credit Block', what will happen?",
        options: [
          "The SAP Order ID is generated with a warning",
          "The PO is auto-cancelled after 24 hours",
          "No SAP Order ID is generated; you must contact the support team",
          "The system retries the credit check automatically"
        ],
        correctIndex: 2   // C – No SAP Order ID is generated
      }
    ]
  },
  {
    triggerTime: 258,       // 4:18
    sectionStart: 190,      // fail hone par 3:10 se replay
    questions: [
      {
        text: "To view individual product/SKU details of a dispatched invoice, which navigation path should you follow?",
        options: [
          "Purchase Order → Add Products → View All",
          "Orders → View All → Order Number → Invoice → Record ID → Opportunity ID → Products → View All",
          "Home Page → Products → SKU Search → View Details",
          "Purchase Order → SAP Details → Credit Check Status"
        ],
        correctIndex: 1   // B – Orders → View All → ...
      }
    ]
  }
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

// ─── Custom Fullscreen (entire player-wrapper, not just video) ────
const playerWrapper = document.getElementById("playerWrapper");

function toggleFullscreen() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fsEl) {
    (playerWrapper.requestFullscreen || playerWrapper.webkitRequestFullscreen)
      .call(playerWrapper);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen)
      .call(document);
  }
}

// Update fullscreen button icon on change
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

// ─── Completion + Thank You Screen ───────────────────────────────
function showThankYou() {
  if (completionShown) return;
  completionShown = true;
  video.pause();
  document.getElementById("thankYouScreen").classList.remove("hidden");
  if (typeof markComplete === "function") markComplete();
}

video.addEventListener("ended", showThankYou);

// ─── Visibility / Focus Guard ─────────────────────────────────────
let awayTimer = null;
let pausedByVisibility = false;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Pause immediately when tab is hidden / window minimised / app switched
    if (!video.paused && !completionShown) {
      video.pause();
      pausedByVisibility = true;
    }
    awayTimer = setTimeout(() => {
      if (typeof markIncomplete === "function") markIncomplete();
    }, 5000);
  } else {
    clearTimeout(awayTimer);
    // Resume only if we paused it and no quiz is currently showing
    const quizActive = document.getElementById("quizOverlay").classList.contains("active");
    if (pausedByVisibility && !completionShown && !quizActive) {
      pausedByVisibility = false;
      video.play().catch(() => {});
    } else {
      pausedByVisibility = false;
    }
  }
});
