// ─────────────────────────────────────────────────────────────────
//  SCORM runtime adapter — video-only course
//  Speaks SCORM 1.2 (cmi.core.*) and falls back to SCORM 2004
//  (API_1484_11) if that is the only API the LMS exposes.
//  API discovery covers SAP SuccessFactors, which opens content
//  through window.open() — the API then lives in window.opener,
//  not window.parent.
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

// SCORM 1.2 first — that is what imsmanifest.xml declares.
const API12   = discover("API");
const API2004 = API12 ? null : discover("API_1484_11");
const API     = API12 || API2004;
const IS_2004 = !!API2004;

const sessionStart = new Date();
let   finished     = false;
let   initialised  = false;

function scormTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

// SCORM 2004 wants an ISO 8601 duration (PT#H#M#S)
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
    return IS_2004 ? API.SetValue(key, String(value))
                   : API.LMSSetValue(key, String(value));
  } catch (e) { return false; }
}

function get(key) {
  if (!API) return "";
  try {
    return IS_2004 ? API.GetValue(key) : API.LMSGetValue(key);
  } catch (e) { return ""; }
}

function commit() {
  if (!API) return;
  try { IS_2004 ? API.Commit("") : API.LMSCommit(""); } catch (e) {}
}

// ── Initialize ───────────────────────────────────────────────────
(function initialise() {
  if (!API) return;
  let ok;
  try {
    ok = IS_2004 ? API.Initialize("") : API.LMSInitialize("");
  } catch (e) { return; }
  if (ok !== "true" && ok !== true && ok !== 1) return;

  initialised = true;

  if (IS_2004) {
    if (get("cmi.completion_status") !== "completed") {
      set("cmi.completion_status", "incomplete");
    }
    set("cmi.exit", "suspend");
    set("cmi.score.min", "0");
    set("cmi.score.max", "100");
  } else {
    const status = get("cmi.core.lesson_status");
    if (status !== "passed" && status !== "completed") {
      set("cmi.core.lesson_status", "incomplete");
    }
    set("cmi.core.exit", "suspend");
    set("cmi.core.session_time", "00:00:01");
    set("cmi.core.score.min", "0");
    set("cmi.core.score.max", "100");
  }
  commit();
})();

// ── Bookmark / resume ────────────────────────────────────────────
function scormGetLocation() {
  const raw = get(IS_2004 ? "cmi.location" : "cmi.core.lesson_location");
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : n;
}

function scormSetLocation(seconds) {
  if (!initialised) return;
  set(IS_2004 ? "cmi.location" : "cmi.core.lesson_location", Math.floor(seconds));
  commit();
}

// ── In-progress ──────────────────────────────────────────────────
function markIncomplete() {
  if (!initialised || finished) return;
  if (IS_2004) {
    if (get("cmi.completion_status") !== "completed") {
      set("cmi.completion_status", "incomplete");
    }
    set("cmi.exit", "suspend");
    set("cmi.session_time", iso8601Time(elapsedSeconds()));
  } else {
    const status = get("cmi.core.lesson_status");
    if (status !== "passed" && status !== "completed") {
      set("cmi.core.lesson_status", "incomplete");
    }
    set("cmi.core.exit", "suspend");
    set("cmi.core.session_time", scormTime(elapsedSeconds()));
  }
  commit();
}

// ── Video watched through ────────────────────────────────────────
// There is no assessment in this course, so watching the video to the
// end is the completion criterion. "passed" is what this client's SAP
// Learning instance is known to accept; SCORM 1.2's "completed" is the
// more precise value for content with no mastery score, and is a
// one-word change here if SAP is configured to prefer it.
function markComplete() {
  if (!initialised) return;
  if (IS_2004) {
    set("cmi.completion_status", "completed");
    set("cmi.success_status",    "passed");
    set("cmi.score.raw",         "100");
    set("cmi.score.scaled",      "1.0");
    set("cmi.session_time",      iso8601Time(elapsedSeconds()));
    set("cmi.exit",              "normal");
  } else {
    set("cmi.core.lesson_status", "passed");
    set("cmi.core.score.raw",     "100");
    set("cmi.core.score.min",     "0");
    set("cmi.core.score.max",     "100");
    set("cmi.core.session_time",  scormTime(elapsedSeconds()));
    set("cmi.core.exit",          "normal");
  }
  commit();
}

// ── Close the session (learner clicks "Mark as Complete") ────────
function finishAndClose() {
  if (!initialised || finished) return;
  finished = true;
  if (IS_2004) {
    set("cmi.session_time", iso8601Time(elapsedSeconds()));
    set("cmi.exit", "normal");
    commit();
    try { API.Terminate(""); } catch (e) {}
  } else {
    set("cmi.core.session_time", scormTime(elapsedSeconds()));
    set("cmi.core.exit", "normal");
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
