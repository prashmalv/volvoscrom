// OPTION 1: passed + manual button click triggers LMSFinish

function findAPI(win) {
  let attempts = 0;
  while (!win.API && win.parent && win.parent !== win && attempts < 10) {
    win = win.parent;
    attempts++;
  }
  return win.API || null;
}

// SAP SuccessFactors opens content via window.open() — API is in window.opener, not window.parent
function getSCORMAPI() {
  let api = findAPI(window);
  if (!api && window.opener) api = findAPI(window.opener);
  if (!api && window.top && window.top !== window && window.top.opener) api = findAPI(window.top.opener);
  return api;
}

const API = getSCORMAPI();
const sessionStart = new Date();

function scormTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

// STEP 1 — Initialize: tell SAP session has started (in-progress)
if (API) {
  const ok = API.LMSInitialize("");
  if (ok === "true" || ok === true || ok === 1) {
    API.LMSSetValue("cmi.core.lesson_status", "incomplete");
    API.LMSSetValue("cmi.core.exit",          "suspend");
    API.LMSSetValue("cmi.core.session_time",  "00:00:01");
    API.LMSCommit("");
  }
}

function markIncomplete() {
  if (!API) return;
  const elapsed = Math.round((new Date() - sessionStart) / 1000);
  API.LMSSetValue("cmi.core.lesson_status", "incomplete");
  API.LMSSetValue("cmi.core.exit",          "suspend");
  API.LMSSetValue("cmi.core.session_time",  scormTime(elapsed));
  API.LMSCommit("");
}

// STEP 2 — video end: save passed status, keep session open
function markComplete() {
  if (!API) return;
  const elapsed = Math.round((new Date() - sessionStart) / 1000);
  API.LMSSetValue("cmi.core.lesson_status", "passed");
  API.LMSSetValue("cmi.core.score.raw",     "100");
  API.LMSSetValue("cmi.core.score.min",     "0");
  API.LMSSetValue("cmi.core.score.max",     "100");
  API.LMSSetValue("cmi.core.session_time",  scormTime(elapsed));
  API.LMSSetValue("cmi.core.exit",          "normal");
  API.LMSCommit("");
}

let finished = false;

// STEP 3 — button click: end session → SAP SF processes completion
function finishAndClose() {
  if (!API || finished) return;
  finished = true;
  const elapsed = Math.round((new Date() - sessionStart) / 1000);
  API.LMSSetValue("cmi.core.lesson_status", "passed");
  API.LMSSetValue("cmi.core.score.raw",     "100");
  API.LMSSetValue("cmi.core.session_time",  scormTime(elapsed));
  API.LMSSetValue("cmi.core.exit",          "normal");
  API.LMSCommit("");
  API.LMSFinish("");
}

window.addEventListener("beforeunload", () => {
  if (!API || finished) return;
  API.LMSFinish("");
});
