// ─────────────────────────────────────────────────────────────────
//  Meeting Etiquette — Online Meetings · END-of-module assessment
//  Source: VCPL_Meeting_Etiquette_Assessment.xlsx
//  Pool of 5 · all 5 delivered · single-correct MCQ
// ─────────────────────────────────────────────────────────────────
const QUESTION_POOL = [
  {
    id: "Q1", lo: "LO2",
    text: "What should you do before joining an online client or internal video conference?",
    options: [
      { t: "Test your audio and video technology in advance and arrive on time", correct: true },
      { t: "Wait until 5 minutes after the call starts to test your microphone" },
      { t: "Keep all desktop browser tabs and personal chats open" },
      { t: "Join with video off and audio muted permanently" },
    ],
    fbRight: "Correct - pre-testing tech ensures meetings start smoothly without technical delays.",
    fbWrong: "Pre-testing tech ensures meetings start smoothly without technical delays."
  },
  {
    id: "Q2", lo: "LO2",
    text: "When attending a virtual meeting from home or a shared office space, what should you do with your camera?",
    options: [
      { t: "Keep camera off at all times without explanation" },
      { t: "Keep camera on where possible and use a professional background or background blur", correct: true },
      { t: "Aim the camera at the ceiling" },
      { t: "Share personal shopping tabs" },
    ],
    fbRight: "Correct - video engagement builds connection, while background blur keeps the focus professional.",
    fbWrong: "Video engagement builds connection, while background blur keeps the focus professional."
  },
  {
    id: "Q3", lo: "LO3",
    text: "When another participant or presenter is speaking, what is the expected etiquette?",
    options: [
      { t: "Talk over them if your point is more important" },
      { t: "Hold side whispers with the colleague beside you" },
      { t: "Listen attentively and wait for your turn or raise your digital hand", correct: true },
      { t: "Type furiously on unrelated emails with microphone unmuted" },
    ],
    fbRight: "Correct - respecting the active speaker and waiting for your turn preserves meeting decorum.",
    fbWrong: "Respecting the active speaker and waiting for your turn preserves meeting decorum."
  },
  {
    id: "Q4", lo: "LO2",
    text: "Before sharing your screen during an online presentation, what critical safety step must you take?",
    options: [
      { t: "Maximize all personal social chat tabs" },
      { t: "Turn off your home Wi-Fi" },
      { t: "Close or hide private tabs, personal emails, and sensitive documents before sharing", correct: true },
      { t: "Turn your volume to maximum" },
    ],
    fbRight: "Correct - protecting sensitive and personal information prevents accidental data exposure.",
    fbWrong: "Protecting sensitive and personal information prevents accidental data exposure."
  },
  {
    id: "Q5", lo: "LO2",
    text: "When joining an online meeting from a potentially noisy or shared location, what is your primary audio rule?",
    options: [
      { t: "Keep your mic unmuted so everyone can hear the background ambience" },
      { t: "Keep yourself muted when not speaking, and unmute only when addressing the group", correct: true },
      { t: "Turn up your speaker volume" },
      { t: "Disconnect without informing the organizer" },
    ],
    fbRight: "Correct - muting yourself eliminates distracting ambient background noise for all participants.",
    fbWrong: "Muting yourself eliminates distracting ambient background noise for all participants."
  },
];

// The whole pool is delivered — there are exactly five questions, and five
// are asked. Only their order and the option order vary between attempts.
const QUIZ_CONFIG = {
  deliverCount:   5,
  passPercent:    80,    // 4 of 5
  maxAttempts:    3,     // one attempt plus two reattempts
  triesPerQuestion: 1,   // a scored assessment: one answer per question
  shuffleQuestions: true,
  shuffleOptions:   true,
  revealCorrectAfterAnswer: true
};
