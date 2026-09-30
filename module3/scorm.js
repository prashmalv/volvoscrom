// ─────────────────────────────────────────────────────────────────
//  SCORM runtime adapter — VCPL C1/M3 Public Wi-Fi
//  Speaks SCORM 1.2 (cmi.core.*) and falls back to SCORM 2004
//  (API_1484_11) if that is the only API the LMS exposes.
//  API discovery covers SAP SuccessFactors, which opens content
//  through window.open() — the API then lives in window.opener.
// ─────────────────────────────────────────────────────────────────

function findAPIIn(win, prop) {
  let attempts = 0;
  while (win && !win[prop] && win.parent && win.parent !== win && attempts < 10) {
    win = win.parent;
    attempts++;
  }
  return (win && win[prop]) || null;
}

function discover(prop) {
  let api = null;
  try { api = findAPIIn(window, prop); } catch (e) {}
  try { if (!api && window.opener) api = findAPIIn(window.opener, prop); } catch (e) {}
  try {
    if (!api && window.top && window.top !== window && window.top.opener) {
      api = findAPIIn(window.top.opener, prop);
    }
  } catch (e) {}
  return api;
}

const API12   = discover("API");
const API2004 = API12 ? null : discover("API_1484_11");
const API     = API12 || API2004;
const IS_2004 = !!API2004;

const sessionStart = new Date();
let   interactionN = 0;
let   finished     = false;
let   initialised  = false;

function scormTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function iso8601Time(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return "PT" + h + "H" + m + "M" + s + "S";
}

function elapsedSeconds() {
  return Math.round((new Date() - sessionStart) / 1000);
}

function set(key, value) {
  if (!API) return false;
  try {
    return IS_2004 ? API.SetValue(key, String(value)) : API.LMSSetValue(key, String(value));
  } catch (e) { return false; }
}

function get(key) {
  if (!API) return "";
  try { return IS_2004 ? API.GetValue(key) : API.LMSGetValue(key); } catch (e) { return ""; }
}

function commit() {
  if (!API) return;
  try { IS_2004 ? API.Commit("") : API.LMSCommit(""); } catch (e) {}
}

// ── Initialize ───────────────────────────────────────────────────
(function initialise() {
  if (!API) return;
  let ok;
  try { ok = IS_2004 ? API.Initialize("") : API.LMSInitialize(""); } catch (e) { return; }
  if (ok !== "true" && ok !== true && ok !== 1) return;

  initialised = true;

  if (IS_2004) {
    if (get("cmi.completion_status") !== "completed") set("cmi.completion_status", "incomplete");
    set("cmi.exit", "suspend");
    set("cmi.score.min", "0");
    set("cmi.score.max", "100");
  } else {
    const status = get("cmi.core.lesson_status");
    if (status !== "passed" && status !== "completed") set("cmi.core.lesson_status", "incomplete");
    set("cmi.core.exit", "suspend");
    set("cmi.core.session_time", "00:00:01");
    set("cmi.core.score.min", "0");
    set("cmi.core.score.max", "100");
  }
  commit();
})();

// ── Bookmark ─────────────────────────────────────────────────────
function scormGetLocation() {
  const n = parseFloat(get(IS_2004 ? "cmi.location" : "cmi.core.lesson_location"));
  return isNaN(n) ? 0 : n;
}

function scormSetLocation(seconds) {
  if (!initialised) return;
  set(IS_2004 ? "cmi.location" : "cmi.core.lesson_location", Math.floor(seconds));
  commit();
}

// ── Attempts, kept in the LMS ────────────────────────────────────
// suspend_data, not a page variable: an attempt limit the learner can
// reset by closing the window and reopening it is not a limit at all.
// Stored as "a=<n>" so another field can be added later without
// invalidating what is already saved in learners' records.
const SUSPEND_KEY = IS_2004 ? "cmi.suspend_data" : "cmi.suspend_data";

function scormGetAttempts() {
  const m = /(?:^|;)a=(\d+)/.exec(get(SUSPEND_KEY) || "");
  return m ? parseInt(m[1], 10) : 0;
}

function scormSetAttempts(n) {
  if (!initialised) return;
  const raw = get(SUSPEND_KEY) || "";
  const next = /(?:^|;)a=\d+/.test(raw)
    ? raw.replace(/(^|;)a=\d+/, "$1a=" + n)
    : (raw ? raw + ";a=" + n : "a=" + n);
  set(SUSPEND_KEY, next);
  commit();
}

// ── In-progress ──────────────────────────────────────────────────
function markIncomplete() {
  if (!initialised || finished) return;
  if (IS_2004) {
    if (get("cmi.completion_status") !== "completed") set("cmi.completion_status", "incomplete");
    set("cmi.exit", "suspend");
    set("cmi.session_time", iso8601Time(elapsedSeconds()));
  } else {
    const status = get("cmi.core.lesson_status");
    if (status !== "passed" && status !== "completed") set("cmi.core.lesson_status", "incomplete");
    set("cmi.core.exit", "suspend");
    set("cmi.core.session_time", scormTime(elapsedSeconds()));
  }
  commit();
}

// ── Per-question logging ─────────────────────────────────────────
function scormLogInteraction(question, chosenIndex, correctIndex, isCorrect) {
  if (!initialised) return;
  const p = "cmi.interactions." + interactionN++ + ".";
  const letter = i => String.fromCharCode(97 + i);

  set(p + "id",   question.id);
  set(p + "type", "choice");
  set(p + "correct_responses.0.pattern", letter(correctIndex));
  set(p + "weighting", "1");

  if (IS_2004) {
    set(p + "description",      question.text.substring(0, 250));
    set(p + "learner_response", letter(chosenIndex));
    set(p + "result",           isCorrect ? "correct" : "incorrect");
    set(p + "objectives.0.id",  question.lo);
  } else {
    set(p + "student_response", letter(chosenIndex));
    set(p + "result",           isCorrect ? "correct" : "wrong");
    set(p + "objectives.0.id",  question.lo);
    set(p + "time",             new Date().toTimeString().substring(0, 8));
  }
  commit();
}

// ── Attempt result ───────────────────────────────────────────────
// Completion is reported only on a pass. A failed attempt still reports a
// score and a failed status — the LMS should see it — but the module must
// not go to "complete", or a learner who never passed would count as done.
function scormSubmitResult(correctCount, totalCount, passed) {
  if (!initialised) return;
  const raw = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;

  if (IS_2004) {
    set("cmi.score.raw",    raw);
    set("cmi.score.min",    "0");
    set("cmi.score.max",    "100");
    set("cmi.score.scaled", (raw / 100).toFixed(2));
    set("cmi.success_status",    passed ? "passed" : "failed");
    set("cmi.completion_status", passed ? "completed" : "incomplete");
    set("cmi.session_time", iso8601Time(elapsedSeconds()));
    set("cmi.exit", passed ? "normal" : "suspend");
  } else {
    set("cmi.core.score.raw", raw);
    set("cmi.core.score.min", "0");
    set("cmi.core.score.max", "100");
    // SCORM 1.2 carries both meanings in one field: "failed" keeps the module
    // on the learner's list, which is what an unpassed attempt should do.
    set("cmi.core.lesson_status", passed ? "passed" : "failed");
    set("cmi.core.session_time",  scormTime(elapsedSeconds()));
    set("cmi.core.exit", passed ? "normal" : "suspend");
  }
  commit();
}

// ── Close the session ────────────────────────────────────────────
function finishAndClose() {
  if (!initialised || finished) return;
  finished = true;
  if (IS_2004) {
    set("cmi.session_time", iso8601Time(elapsedSeconds()));
    commit();
    try { API.Terminate(""); } catch (e) {}
  } else {
    set("cmi.core.session_time", scormTime(elapsedSeconds()));
    commit();
    try { API.LMSFinish(""); } catch (e) {}
  }
  try { window.close(); } catch (e) {}
}

window.addEventListener("beforeunload", () => {
  if (!initialised || finished) return;
  finished = true;
  try { IS_2004 ? API.Terminate("") : API.LMSFinish(""); } catch (e) {}
});
