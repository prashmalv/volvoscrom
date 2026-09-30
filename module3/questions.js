// ─────────────────────────────────────────────────────────────────
//  C1 / M3 — Public Wi-Fi & Rogue Hotspots · END-of-module assessment
//  Source: VCPL_Course1_M3_PublicWiFi_Storyboard · sheet "Assessment (END)"
//  Pool of 10 · deliver 5 at random · single-correct MCQ
// ─────────────────────────────────────────────────────────────────
const QUESTION_POOL = [
  {
    id: "Q1", lo: "LO1",
    text: "Why is connecting to open public Wi-Fi without a password inherently dangerous?",
    options: [
      { t: "It drains laptop battery faster" },
      { t: "It has zero encryption, broadcasting all data packets in the clear to anyone nearby", correct: true },
      { t: "It only works for smartphones" },
      { t: "It requires corporate admin privileges" }
    ],
    fbRight: "Correct — open Wi-Fi lacks radio encryption, meaning anyone nearby can capture traffic.",
    fbWrong: "A public network without a password has zero encryption, broadcasting data in the clear."
  },
  {
    id: "Q2", lo: "LO2",
    text: "What is an 'Evil Twin' Wi-Fi hotspot?",
    options: [
      { t: "A network with two routers for redundancy" },
      { t: "A rogue portable hotspot set up by an attacker mimicking a legitimate venue SSID", correct: true },
      { t: "An official airport guest Wi-Fi portal" },
      { t: "A dual-band 5GHz channel" }
    ],
    fbRight: "Correct — Evil Twins mimic authentic venue names (e.g. Airport_WiFi_Free) to hijack traffic.",
    fbWrong: "Evil Twins are attacker-controlled rogue access points designed to steal credentials."
  },
  {
    id: "Q3", lo: "LO1",
    text: "How do attackers capture data on unencrypted public Wi-Fi?",
    options: [
      { t: "By physically stealing the laptop" },
      { t: "Using packet-sniffing software to capture radio signals floating in the air", correct: true },
      { t: "By sending a calendar invite" },
      { t: "Through Bluetooth pairing only" }
    ],
    fbRight: "Correct — free packet-sniffing software can intercept unencrypted data in seconds.",
    fbWrong: "Unencrypted radio packets travel through the air where packet sniffers can read them."
  },
  {
    id: "Q4", lo: "LO3",
    text: "Under Defense Rule 1, when is it safe to connect to an open public Wi-Fi network without a VPN?",
    options: [
      { t: "When checking work email for two minutes" },
      { t: "When sitting inside a high-end cafe" },
      { t: "Never — avoid open, unsecured public networks entirely", correct: true },
      { t: "Only during regular business hours" }
    ],
    fbRight: "Correct — legitimate corporate practice requires avoiding unsecured public Wi-Fi entirely.",
    fbWrong: "Never connect to open public networks without encryption, even 'just for two minutes.'"
  },
  {
    id: "Q5", lo: "LO4",
    text: "What does a corporate VPN (such as FortiToken) do to protect your data on public networks?",
    options: [
      { t: "It increases internet download speed" },
      { t: "It wraps your data in a secure, encrypted tunnel to the enterprise core", correct: true },
      { t: "It hides the laptop screen from people behind you" },
      { t: "It blocks all incoming emails" }
    ],
    fbRight: "Correct — a VPN encapsulates data in an encrypted tunnel, rendering it unreadable to snoopers.",
    fbWrong: "A corporate VPN encrypts your traffic end-to-end between your device and the enterprise core."
  },
  {
    id: "Q6", lo: "LO5",
    text: "What is the primary security advantage of using your smartphone's personal mobile hotspot?",
    options: [
      { t: "It is completely free of charge" },
      { t: "Cellular connections are encrypted by default and isolated from nearby public users", correct: true },
      { t: "It bypasses company IT policies" },
      { t: "It has faster Wi-Fi antennas" }
    ],
    fbRight: "Correct — cellular mobile hotspots provide an isolated, encrypted private network.",
    fbWrong: "Cellular data is isolated from other users in the room, eliminating local eavesdropping."
  },
  {
    id: "Q7", lo: "LO2",
    text: "You see two networks at a hotel: 'GrandHotel_Guest' and 'GrandHotel_Free_WiFi'. What should you suspect?",
    options: [
      { t: "Both networks are identical and safe" },
      { t: "The second network could be an Evil Twin rogue access point", correct: true },
      { t: "The hotel upgraded its bandwidth" },
      { t: "One network is for room service only" }
    ],
    fbRight: "Correct — near-identical names with 'Free' added are classic indicators of rogue APs.",
    fbWrong: "Attackers frequently add 'Free' to legitimate venue names to trap unsuspecting users."
  },
  {
    id: "Q8", lo: "LO4",
    text: "If you must use hotel or venue Wi-Fi for business tasks, what step is mandatory?",
    options: [
      { t: "Browse in Incognito mode only" },
      { t: "Turn on your company VPN before opening any work application or email", correct: true },
      { t: "Delete your browser history afterwards" },
      { t: "Only connect from the hotel lobby" }
    ],
    fbRight: "Correct — corporate VPN must be active before opening any corporate applications.",
    fbWrong: "Incognito mode does not encrypt network traffic; a corporate VPN is mandatory."
  },
  {
    id: "Q9", lo: "LO1",
    text: "Which types of sensitive corporate data can be intercepted on an unsecured public network?",
    options: [
      { t: "Only public website URLs" },
      { t: "Single sign-on passwords, session tokens, banking credentials, and confidential files", correct: true },
      { t: "Hardware serial numbers only" },
      { t: "Nothing, because browsers block all threats" }
    ],
    fbRight: "Correct — session tokens, credentials, and intranet documents can all be captured.",
    fbWrong: "Attackers can harvest credentials, active cookies, and unencrypted file transfers."
  },
  {
    id: "Q10", lo: "LO5",
    text: "What are the Three Golden Rules for public connectivity taught in this module?",
    options: [
      { t: "Connect fast, work offline, log out" },
      { t: "Avoid Open Wi-Fi, Always Use Corporate VPN, Prefer Personal Mobile Hotspot", correct: true },
      { t: "Use public computers, borrow chargers, share passwords" },
      { t: "Ignore alerts, accept all certificates, save Wi-Fi passwords" }
    ],
    fbRight: "Correct — Avoid Open Wi-Fi, Use VPN, Prefer Hotspot.",
    fbWrong: "The three core defensive habits are: Avoid Open Wi-Fi, Use VPN, Prefer Hotspot."
  }
];

// Delivery rules. The pass mark and attempt count are the client's, and
// override the storyboard header, which says 0.70 while also saying 4 of 5 —
// and 4 of 5 is 80%.
const QUIZ_CONFIG = {
  deliverCount:   5,     // 5 at random from the pool of 10
  passPercent:    80,    // 4 of 5
  maxAttempts:    3,     // one attempt plus the two reattempts allowed
  triesPerQuestion: 1,   // a scored assessment: one answer per question
  shuffleQuestions: true,
  shuffleOptions:   true,
  revealCorrectAfterAnswer: true
};
