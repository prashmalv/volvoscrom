// ─────────────────────────────────────────────────────────────────
//  Meeting Etiquette — Physical Meetings · END-of-module assessment
//  Source: VCPL_Meeting_Etiquette_Assessment.xlsx
//  Pool of 5 · all 5 delivered · single-correct MCQ
// ─────────────────────────────────────────────────────────────────
const QUESTION_POOL = [
  {
    id: "Q1", lo: "LO1",
    text: "If your meeting plans change or the session is cancelled, what is the correct protocol?",
    options: [
      { t: "Leave the booking active just in case" },
      { t: "Release the room booking immediately so others can use it", correct: true },
      { t: "Tell your immediate desk neighbor only" },
      { t: "Turn off the room lights" },
    ],
    fbRight: "Correct - always release unused meeting rooms promptly to maintain workplace efficiency.",
    fbWrong: "Always release unused meeting rooms promptly to maintain workplace efficiency."
  },
  {
    id: "Q2", lo: "LO1",
    text: "Why must food and messy snacks never be brought into conference meeting rooms?",
    options: [
      { t: "It drains laptop battery" },
      { t: "It creates distracting chewing noises, strong odors, and leaves messy crumbs on shared tables", correct: true },
      { t: "The digital projector stops working" },
      { t: "Company policy only permits tea during morning hours" },
    ],
    fbRight: "Correct - food distracts attendees, causes unpleasant odors, and leaves messy crumbs.",
    fbWrong: "Food distracts attendees, causes unpleasant odors, and leaves messy crumbs."
  },
  {
    id: "Q3", lo: "LO1",
    text: "What should you do before leaving a physical meeting room after a session concludes?",
    options: [
      { t: "Leave used paper cups and papers on the desk for facilities staff" },
      { t: "Pick up your cups, clear personal items, push chairs back under the table, and leave the room tidy", correct: true },
      { t: "Leave the projector screen running" },
      { t: "Lock the glass door" },
    ],
    fbRight: "Correct - leaving the room tidy respects the next team scheduled to use the space.",
    fbWrong: "Leaving the room tidy respects the next team scheduled to use the space."
  },
  {
    id: "Q4", lo: "LO3",
    text: "If a meeting room reservation ends at 11:00 AM, what should the team inside do?",
    options: [
      { t: "Continue talking until the next group forces their way into the room" },
      { t: "Wrap up by the scheduled time and vacate the room promptly for the next booking", correct: true },
      { t: "Book the room for the rest of the day without permission" },
      { t: "Move the meeting into the hallway unannounced" },
    ],
    fbRight: "Correct - respecting booked time slots ensures colleagues are not stranded waiting outside.",
    fbWrong: "Respecting booked time slots ensures colleagues are not stranded waiting outside."
  },
  {
    id: "Q5", lo: "LO3",
    text: "When you receive a calendar invitation for a business meeting, what is the best practice?",
    options: [
      { t: "Ignore the notification completely" },
      { t: "Promptly respond by accepting or declining so organizers can plan confirmed attendee counts", correct: true },
      { t: "Accept only if the meeting includes free lunch" },
      { t: "Delete the calendar invite without notifying the host" },
    ],
    fbRight: "Correct - prompt RSVPs allow meeting hosts to organize agendas, seating, and technology effectively.",
    fbWrong: "Prompt RSVPs allow meeting hosts to organize agendas, seating, and technology effectively."
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
