// ─────────────────────────────────────────────────────────────────
//  C1 / M4 — Domain Awareness & Malicious Links · END-of-module assessment
//  Source: VCPL_Course1_M4_DomainAwareness.xlsx · sheet "Assessment (END)"
//  Pool of 10 · deliver 5 at random · single-correct MCQ
//
//  The sheet header says "Pool of 11"; the sheet itself holds 10 questions.
//  The count here follows the questions, not the header.
// ─────────────────────────────────────────────────────────────────
const QUESTION_POOL = [
  {
    id: "Q1", lo: "LO1",
    text: "In Scene 1, what revealed that the link in the email was dangerous?",
    options: [
      { t: "The email was sent after 5 PM" },
      { t: "Hovering the cursor showed a completely different, garbled destination in the tooltip", correct: true },
      { t: "The sender address was empty" },
      { t: "The font was colored red" },
    ],
    fbRight: "Correct — visible link text can say anything, but the hover preview reveals where it actually points.",
    fbWrong: "Visible link text is easily disguised; hovering before clicking reveals the true target URL. (Scene 1)"
  },
  {
    id: "Q2", lo: "LO1",
    text: "How do attackers typically create \"lookalike\" domains to fool employees at a glance?",
    options: [
      { t: "By hacking the official domain registrar" },
      { t: "Substituting characters that look identical (such as \"rn\" for \"m\", or \"0\" for \"O\")", correct: true },
      { t: "By adding a paid verified badge" },
      { t: "By using all-capital letters" },
    ],
    fbRight: "Correct — visual character substitution (typosquatting) is designed to deceive a hurried glance.",
    fbWrong: "Attackers rely on near-identical character swaps like \"rn\" appearing as \"m\". (Scene 2)"
  },
  {
    id: "Q3", lo: "LO2",
    text: "Which domain pattern indicates a genuine, official Indian government portal?",
    options: [
      { t: ".gov-india.com" },
      { t: ".gov.org.in" },
      { t: ".gov.in or .nic.in", correct: true },
      { t: ".government-verify.in" },
    ],
    fbRight: "Correct — genuine Indian government sites end strictly in .gov.in or .nic.in.",
    fbWrong: "Official government portals in India always end in .gov.in or .nic.in. Replicas using .com or .org are scams. (Scene 3)"
  },
  {
    id: "Q4", lo: "LO3",
    text: "Why are unexpected attachments ending in .exe, .scr, or .zip especially dangerous?",
    options: [
      { t: "They take up too much storage on your hard drive" },
      { t: "They are executable programs or compressed archives that can silently run malware", correct: true },
      { t: "They only open on personal phones" },
      { t: "They disable your monitor display" },
    ],
    fbRight: "Correct — executable and script files can deploy malware the instant they are opened.",
    fbWrong: "Files ending in .exe, .scr, .zip, or .js can run malicious code directly on your machine. (Scene 4)"
  },
  {
    id: "Q5", lo: "LO4",
    text: "An email demands you click a link within 10 minutes or your account will be permanently closed. This is an example of:",
    options: [
      { t: "Standard IT maintenance notification" },
      { t: "Manufactured urgency designed to bypass critical thinking", correct: true },
      { t: "Legal compliance procedure" },
      { t: "Multi-factor authentication" },
    ],
    fbRight: "Correct — urgent deadlines and countdown timers are psychological manipulation tactics.",
    fbWrong: "Urgency + pressure is a major red flag designed to make you act before you think. (Scene 5)"
  },
  {
    id: "Q6", lo: "LO1",
    text: "You receive an email linking to \"www.valvoline-cumrnins.com\". What should immediately catch your eye?",
    options: [
      { t: "The company logo in the header" },
      { t: "The subtle swap of \"rn\" in place of the letter \"m\"", correct: true },
      { t: "The copyright date at the bottom" },
      { t: "The email signature layout" },
    ],
    fbRight: "Correct — \"cumrnins\" uses \"rn\" to mimic \"m\".",
    fbWrong: "Always inspect domain spellings letter-by-letter. \"rn\" placed closely mimics \"m\". (Scene 2)"
  },
  {
    id: "Q7", lo: "LO2",
    text: "A portal claiming to be the Income Tax Department sends you a refund link ending in \".com-verify.in\". What should you do?",
    options: [
      { t: "Click the link immediately to claim your refund" },
      { t: "Treat it as suspicious and do not enter any personal details", correct: true },
      { t: "Forward it to your colleagues" },
      { t: "Reply asking for a phone confirmation" },
    ],
    fbRight: "Correct — real tax portals end strictly in .gov.in or .nic.in, never .com-verify.in.",
    fbWrong: "Official government portals never use .com-verify.in; treat any link not ending in .gov.in or .nic.in as fake. (Scene 3)"
  },
  {
    id: "Q8", lo: "LO3",
    text: "Why should shortened URLs (like bit.ly links) in unexpected emails be treated with extra caution?",
    options: [
      { t: "They expire within 24 hours" },
      { t: "They conceal the real destination address, hiding malicious websites", correct: true },
      { t: "They block your internet browser" },
      { t: "They can only be opened on mobile devices" },
    ],
    fbRight: "Correct — link shorteners obscure the real URL, preventing you from evaluating the domain safely.",
    fbWrong: "Shortened links hide where they lead. Never click unverified shortened URLs. (Scene 4)"
  },
  {
    id: "Q9", lo: "LO5",
    text: "What is Defense Rule #1 whenever you encounter any hyperlink in an email or chat?",
    options: [
      { t: "Click it quickly to see if antivirus blocks it" },
      { t: "Hover over the link before clicking to preview the real destination address", correct: true },
      { t: "Forward it to external friends" },
      { t: "Copy and paste it into social media" },
    ],
    fbRight: "Correct — always hover first to inspect the true URL in the browser status bar.",
    fbWrong: "Hovering before clicking allows you to preview where the link actually leads. (Scene 6)"
  },
  {
    id: "Q10", lo: "LO4",
    text: "When an email notification combines high urgency, forced panic, and an unverified link, what should you do?",
    options: [
      { t: "Rush to comply before the timer expires" },
      { t: "Pause, step back, and verify the issue independently", correct: true },
      { t: "Share your password to unlock the account" },
      { t: "Ignore company security protocols" },
    ],
    fbRight: "Correct — urgency is engineered to cause panic; pausing breaks the trap.",
    fbWrong: "Urgency + pressure is a red flag, not a reason to rush. Always pause and verify independently. (Scene 5)"
  },
];

// The client's rules, as for Modules 2 and 3. They override the storyboard
// header, which says 0.70 while also saying 4 of 5 — and 4 of 5 is 80%.
const QUIZ_CONFIG = {
  deliverCount:   5,     // 5 at random from the pool of 10
  passPercent:    80,    // 4 of 5
  maxAttempts:    3,     // one attempt plus the two reattempts allowed
  triesPerQuestion: 1,   // a scored assessment: one answer per question
  shuffleQuestions: true,
  shuffleOptions:   true,
  revealCorrectAfterAnswer: true
};
