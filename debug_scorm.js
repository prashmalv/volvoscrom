const logBox = document.getElementById("logBox");
const apiStatusEl = document.getElementById("apiStatus");
const btnComplete = document.getElementById("btnComplete");
const resultBanner = document.getElementById("resultBanner");

function log(msg, type) {
  const div = document.createElement("div");
  div.className = "log-line log-" + (type || "info");
  const ts = new Date().toISOString().substring(11, 19);
  div.textContent = "[" + ts + "] " + msg;
  logBox.appendChild(div);
  logBox.scrollTop = logBox.scrollHeight;
  console.log(msg);
}

function callStr(result) {
  return String(result);
}

// Walk up to 20 parent frames looking for SCORM API
function findAPI(win) {
  let attempts = 0;
  while (win.API == null && win.parent && win.parent !== win && attempts < 20) {
    win = win.parent;
    attempts++;
  }
  log("findAPI: checked " + attempts + " parent frame(s)", "info");
  return win.API || null;
}

// SAP SuccessFactors opens content via window.open() — API lives in window.opener
function getSCORMAPI() {
  let api = findAPI(window);
  if (api) { log("API found via window.parent chain", "ok"); return api; }
  log("API not found in parent chain — trying window.opener (SAP SF path)…", "warn");
  if (window.opener) {
    api = findAPI(window.opener);
    if (api) { log("API found via window.opener", "ok"); return api; }
  }
  if (window.top && window.top !== window && window.top.opener) {
    api = findAPI(window.top.opener);
    if (api) { log("API found via window.top.opener", "ok"); return api; }
  }
  log("API not found in any location (parent, opener, top.opener)", "err");
  return null;
}

const sessionStart = new Date();

function scormTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

// Clear initial "Initialising…" line
logBox.innerHTML = "";

log("Page loaded — locating SCORM API…", "info");

const API = getSCORMAPI();

if (!API) {
  apiStatusEl.textContent = "NOT FOUND — SCORM tracking disabled";
  apiStatusEl.className = "api-status api-missing";
  log("API is NULL — no SCORM tracking possible in this environment", "err");
  log("Possible reasons: opened outside an LMS, or LMS uses SCORM 2004 (API_1484_11)", "warn");
  btnComplete.disabled = false; // still allow test click to show message
} else {
  log("API object found successfully", "ok");

  const initResult = API.LMSInitialize("");
  log("LMSInitialize(\"\") → " + callStr(initResult), initResult === "true" || initResult === true ? "ok" : "err");

  if (initResult === "true" || initResult === true || initResult === 1) {
    const r1 = API.LMSSetValue("cmi.core.lesson_status", "incomplete");
    log("SetValue lesson_status=incomplete → " + callStr(r1), r1 === "true" || r1 === true ? "ok" : "err");

    const r2 = API.LMSSetValue("cmi.core.exit", "suspend");
    log("SetValue exit=suspend → " + callStr(r2), "info");

    const r3 = API.LMSSetValue("cmi.core.session_time", "00:00:01");
    log("SetValue session_time=00:00:01 → " + callStr(r3), "info");

    const r4 = API.LMSCommit("");
    log("LMSCommit(\"\") → " + callStr(r4), r4 === "true" || r4 === true ? "ok" : "err");

    apiStatusEl.textContent = "FOUND — LMS session active";
    apiStatusEl.className = "api-status api-found";
    log("Initialisation complete. Click 'Mark as Complete' to test.", "ok");
    btnComplete.disabled = false;
  } else {
    apiStatusEl.textContent = "FOUND but LMSInitialize FAILED";
    apiStatusEl.className = "api-status api-missing";
    log("LMSInitialize returned false/error — check LMS config", "err");
    btnComplete.disabled = false;
  }
}

let finished = false;

function doComplete() {
  btnComplete.disabled = true;

  if (!API) {
    log("No API — cannot send completion to LMS", "err");
    log("If you see this in SAP SF, the SCORM API is not accessible", "warn");
    return;
  }

  if (finished) {
    log("Already marked complete — ignoring duplicate call", "warn");
    return;
  }
  finished = true;

  const elapsed = Math.round((new Date() - sessionStart) / 1000);
  const timeStr = scormTime(elapsed);
  log("--- MARKING COMPLETE (elapsed: " + elapsed + "s) ---", "info");

  const v1 = API.LMSSetValue("cmi.core.lesson_status", "passed");
  log("SetValue lesson_status=passed → " + callStr(v1), v1 === "true" || v1 === true ? "ok" : "err");

  const v2 = API.LMSSetValue("cmi.core.score.raw", "100");
  log("SetValue score.raw=100 → " + callStr(v2), "info");

  const v3 = API.LMSSetValue("cmi.core.score.min", "0");
  log("SetValue score.min=0 → " + callStr(v3), "info");

  const v4 = API.LMSSetValue("cmi.core.score.max", "100");
  log("SetValue score.max=100 → " + callStr(v4), "info");

  const v5 = API.LMSSetValue("cmi.core.session_time", timeStr);
  log("SetValue session_time=" + timeStr + " → " + callStr(v5), "info");

  const v6 = API.LMSSetValue("cmi.core.exit", "normal");
  log("SetValue exit=normal → " + callStr(v6), "info");

  const commitResult = API.LMSCommit("");
  log("LMSCommit(\"\") → " + callStr(commitResult), commitResult === "true" || commitResult === true ? "ok" : "err");

  const finishResult = API.LMSFinish("");
  log("LMSFinish(\"\") → " + callStr(finishResult), finishResult === "true" || finishResult === true ? "ok" : "err");

  log("=== COMPLETION SEQUENCE DONE ===", "ok");
  resultBanner.classList.add("show");
}

window.addEventListener("beforeunload", () => {
  if (API && !finished) {
    API.LMSSetValue("cmi.core.lesson_status", "incomplete");
    API.LMSSetValue("cmi.core.exit", "suspend");
    API.LMSCommit("");
    API.LMSFinish("");
  }
});
