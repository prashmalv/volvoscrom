// ─────────────────────────────────────────────────────────────────
//  C1 / M1 — Password Hygiene · END-of-module assessment pool
//  Source: VCPL_Course1_M1_PasswordHygiene_Storyboard_v2 · sheet "Assessment (END)"
//  Pool of 11 · deliver 5 at random · single-correct MCQ
//  Pass = scaled 0.70 (4 of 5) · randomise option order · log responses
// ─────────────────────────────────────────────────────────────────
const QUESTION_POOL = [
  {
    id: "Q1", lo: "LO1",
    text: "Which is the strongest password?",
    options: [
      { t: "P@ss1!" },
      { t: "A passphrase of 3–4 random words", correct: true },
      { t: "Pet's name + birth year" },
      { t: '"password" with a number' }
    ],
    fbRight: "Right — length beats complexity.",
    fbWrong: "A long 3–4 word passphrase is far stronger than a short symbol-heavy one."
  },
  {
    id: "Q2", lo: "LO2",
    text: "Why use a different password for every account?",
    options: [
      { t: "Legal requirement" },
      { t: "If one site is breached, your other accounts stay safe", correct: true },
      { t: "Makes login slower" },
      { t: "Websites require it" }
    ],
    fbRight: "Correct — unique passwords contain the damage.",
    fbWrong: "Reuse means one breach unlocks everything."
  },
  {
    id: "Q3", lo: "LO4",
    text: "What does MFA (Microsoft Authenticator) add?",
    options: [
      { t: "Faster login" },
      { t: "A second layer that blocks access even if your password is stolen", correct: true },
      { t: "A stronger password automatically" },
      { t: "It replaces your password" }
    ],
    fbRight: "Correct — MFA is a second lock.",
    fbWrong: "MFA needs approval on your registered device, so a stolen password isn't enough."
  },
  {
    id: "Q4", lo: "LO5",
    text: "Roughly what share of breaches involve weak or reused passwords?",
    options: [
      { t: "Under 10%" },
      { t: "About 30%" },
      { t: "Over 80%", correct: true },
      { t: "Exactly 100%" }
    ],
    fbRight: "Correct.",
    fbWrong: "Over 80% (Verizon DBIR) — the weak link is usually human."
  },
  {
    id: "Q5", lo: "LO5",
    text: "At work, a reused password most directly puts which at risk?",
    options: [
      { t: "Only your personal email" },
      { t: "Company systems and customer/dealer data", correct: true },
      { t: "Nothing if the site is small" },
      { t: "Only social media" }
    ],
    fbRight: "Correct.",
    fbWrong: "At work your credentials guard company and customer/dealer data."
  },
  {
    id: "Q6", lo: "LO1",
    text: "Which passphrase is best practice?",
    options: [
      { t: "Qz!7" },
      { t: "river-basket-orange-clock", correct: true },
      { t: "12345678" },
      { t: "YourName@2024" }
    ],
    fbRight: "Correct — long, random, memorable.",
    fbWrong: "Several unrelated words beat short complex strings."
  },
  {
    id: "Q7", lo: "LO2",
    text: "Your streaming account is breached. What is the risk if you reused that password at work?",
    options: [
      { t: "None — different sites" },
      { t: "Attackers can try the same password on your work login", correct: true },
      { t: "Only streaming is affected" },
      { t: "Your device breaks" }
    ],
    fbRight: "Correct — this is credential stuffing.",
    fbWrong: "Attackers reuse stolen passwords across sites."
  },
  {
    id: "Q8", lo: "LO3",
    text: "Which is safe practice for your work password?",
    options: [
      { t: "Save it in the browser" },
      { t: "Keep it to yourself; don't save it in files or sticky notes", correct: true },
      { t: "Share it with a teammate for cover" },
      { t: "Email it to yourself" }
    ],
    fbRight: "Correct.",
    fbWrong: "Don't store passwords in the browser, in files, or on sticky notes."
  },
  {
    id: "Q9", lo: "LO4",
    text: "When should you enable MFA?",
    options: [
      { t: "Only after a breach" },
      { t: "Now — on every account that offers it, starting with work email & VPN", correct: true },
      { t: "Never" },
      { t: "Only on your bank" }
    ],
    fbRight: "Correct.",
    fbWrong: "Turn MFA on proactively, especially for work email & VPN."
  },
  {
    id: "Q10", lo: "LO5",
    text: "Who is responsible for password security at Valvoline Cummins?",
    options: [
      { t: "Only IT" },
      { t: "Only managers" },
      { t: "Every employee", correct: true },
      { t: "Only new joiners" }
    ],
    fbRight: "Correct.",
    fbWrong: "Every employee is a line of defence."
  },
  {
    id: "Q11", lo: "LO5",
    text: "You think your password may be exposed. What do you do?",
    options: [
      { t: "Wait and see" },
      { t: "Change it immediately and raise an IT Service Desk ticket", correct: true },
      { t: "Tell a colleague and move on" },
      { t: "Nothing" }
    ],
    fbRight: "Correct — act fast and report.",
    fbWrong: "Change it right away and raise an IT Service Desk ticket."
  }
];

// Delivery rules (from the storyboard's SCORM behaviour spec)
const QUIZ_CONFIG = {
  deliverCount:   5,      // 5 random from the pool of 11
  passRatio:      0.70,   // scaled 0.70 → 4 of 5
  shuffleOptions: true,
  videoCompleteAt: 0.95,  // video counted as viewed at 95%

  // Tries per question, for questions with 3+ options. Deliberately one
  // fewer than the option count so the answer cannot be reached by
  // elimination — with 4 options and 4 tries, everyone scores 100%.
  maxAttempts:    3,

  // Only the first answer counts toward the score. The retries are there
  // to teach; if any-attempt-correct counted, almost nobody would ever
  // miss the 70% mark and the relaunch path would be dead code.
  scoreOnFirstAttemptOnly: true
};
