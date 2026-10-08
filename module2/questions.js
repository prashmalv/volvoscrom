// ─────────────────────────────────────────────────────────────────
//  C1 / M2 — Phishing Communications · END-of-module assessment
//  Source: VCPL_Course1_M2_Phishing_Storyboard · sheet "Assessment (END)"
//  Pool of 11 · deliver 5 at random · single-correct MCQ
// ─────────────────────────────────────────────────────────────────
const QUESTION_POOL = [
  {
    id: "Q1", lo: "LO1",
    text: "Which detail most reliably signals the email is fake?",
    options: [
      { t: "The urgent tone" },
      { t: "A slightly misspelled sender domain", correct: true },
      { t: 'The subject line says "Confidential"' },
      { t: "It was sent during work hours" }
    ],
    fbRight: "Correct — the domain is the giveaway.",
    fbWrong: "A near-identical but subtly wrong domain is the strongest signal, not tone or subject line."
  },
  {
    id: "Q2", lo: "LO1",
    text: 'On Teams, what should make you pause before replying to an unfamiliar "CFO" account?',
    options: [
      { t: "The message uses proper grammar" },
      { t: "The account is marked (External) but claims to be internal leadership", correct: true },
      { t: "The chat has an emoji" },
      { t: "It was sent in the morning" }
    ],
    fbRight: "Correct — internal leadership is never marked External.",
    fbWrong: "The (External) tag contradicts the claimed identity — a clear red flag."
  },
  {
    id: "Q3", lo: "LO2",
    text: "You get an urgent WhatsApp money-transfer request from your MD's saved photo, but an unfamiliar number. What should you do?",
    options: [
      { t: "Transfer the money since it's urgent" },
      { t: "Call the person on a number you already have saved to verify", correct: true },
      { t: "Reply on WhatsApp asking for proof" },
      { t: "Wait until tomorrow to confirm" }
    ],
    fbRight: "Correct — verify via a separate, known channel.",
    fbWrong: "Never confirm through the same channel the request came from."
  },
  {
    id: "Q4", lo: "LO3",
    text: "A genuine, legitimate business request will typically:",
    options: [
      { t: "Ask you to keep it secret from colleagues" },
      { t: "Never demand secrecy or bypassing normal process", correct: true },
      { t: "Always come from a personal number" },
      { t: "Require instant action without verification" }
    ],
    fbRight: "Correct.",
    fbWrong: "Secrecy and urgency together are hallmarks of social engineering."
  },
  {
    // Replaced on the client's instruction (8 Oct 2026): the two questions on
    // reporting via Outlook were dropped, and these supplied in their place.
    id: "Q5", lo: "LO3",
    text: "Why do cyber attackers frequently combine a false claim of authority with intense urgency in corporate phishing attempts?",
    options: [
      { t: "To test the encryption limits of company servers" },
      { t: "To induce panic and rush your response, preventing you from thinking critically or verifying", correct: true },
      { t: "To ensure the message is delivered faster across mobile networks" },
      { t: "To comply with standard IT security audit guidelines" }
    ],
    fbRight: "Correct — panic is the point: rushed people skip the check that would expose the request.",
    fbWrong: "Authority and urgency together are meant to rush you past verifying — that pressure is itself the warning sign."
  },
  {
    id: "Q6", lo: "LO1",
    text: "Which combination of signals appeared across all three channels in this module?",
    options: [
      { t: "Long, formal messages" },
      { t: "Urgency, secrecy, and a claim of authority", correct: true },
      { t: "Requests to update your profile picture" },
      { t: "Multiple recipients on the message" }
    ],
    fbRight: "Correct — the same pattern recurs across every channel.",
    fbWrong: "Urgency + secrecy + authority is the shared pattern, regardless of app."
  },
  {
    id: "Q7", lo: "LO2",
    text: "Why is calling a known, saved number better than replying in the same chat/email thread?",
    options: [
      { t: "It's faster" },
      { t: "It confirms the request through a channel the attacker doesn't control", correct: true },
      { t: "It creates a written record" },
      { t: "It's required by company policy for all requests" }
    ],
    fbRight: "Correct — a second, independent channel breaks the attacker's control.",
    fbWrong: "Replying in-thread only reaches the attacker again."
  },
  {
    id: "Q8", lo: "LO3",
    text: 'A message asks you to "keep this between us" and skip your usual approval process. This is:',
    options: [
      { t: "Normal for confidential financial matters" },
      { t: "A red flag — legitimate requests don't require secrecy or bypassing process", correct: true },
      { t: "Fine if it's from a senior leader" },
      { t: "Only a concern over email, not chat apps" }
    ],
    fbRight: "Correct.",
    fbWrong: "Secrecy + bypassing process, regardless of who appears to be asking, is a warning sign."
  },
  {
    id: "Q9", lo: "LO1",
    text: "In the email scenario, what specific warning notice appears on the screen to highlight that the message came from outside the organization?",
    options: [
      { t: "\u201CWarning: High-risk financial attachment detected\u201D" },
      { t: "\u201CThis email originated from outside the organization\u201D", correct: true },
      { t: "\u201CNotice: External sender identity unverified by certificate\u201D" },
      { t: "\u201CCaution: Internal policy violation warning\u201D" }
    ],
    fbRight: "Correct — that banner is the system telling you the sender is not internal.",
    fbWrong: "The banner reads \u201CThis email originated from outside the organization\u201D — a sender claiming to be internal contradicts it."
  },
  {
    id: "Q10", lo: "LO5",
    text: "What's the one common thread across the email, Teams, and WhatsApp examples in this module?",
    options: [
      { t: "They all used AI-generated images" },
      { t: "Urgency, secrecy, and a false claim of authority, aimed at rushing your response", correct: true },
      { t: "They were all sent late at night" },
      { t: "They all requested a phone call back" }
    ],
    fbRight: "Correct — that pattern is the core lesson.",
    fbWrong: "Recognizing this pattern matters more than memorizing any single example."
  },
  {
    id: "Q11", lo: "LO5",
    text: 'A colleague asks whether phishing training is "only about email." What\'s the best answer?',
    options: [
      { t: "Yes, phishing only happens over email" },
      { t: "No — the same tactics show up over Teams, WhatsApp, and other channels too", correct: true },
      { t: "Only if the company blocks the sender" },
      { t: "Only external senders can phish you" }
    ],
    fbRight: "Correct — phishing is channel-agnostic.",
    fbWrong: "This module deliberately covers three different channels to show the pattern isn't email-only."
  }
];

// Same delivery rules as Module 3, as the client set them. They override the
// storyboard header, which says 0.70 while also saying 4 of 5 — and 4 of 5
// is 80%.
const QUIZ_CONFIG = {
  deliverCount:   5,     // 5 at random from the pool of 11
  passPercent:    80,    // 4 of 5
  maxAttempts:    3,     // one attempt plus the two reattempts allowed
  triesPerQuestion: 1,   // a scored assessment: one answer per question
  shuffleQuestions: true,
  shuffleOptions:   true,
  revealCorrectAfterAnswer: true
};
