function findAPI(win) {
  let attempts = 0;
  while (!win.API && !win.API_1484_11 && win.parent && win.parent !== win && attempts < 10) {
    win = win.parent;
    attempts++;
  }
  return win.API_1484_11 || win.API || null;
}

const API = findAPI(window);

// Init
if (API) {
  if (API.Initialize) API.Initialize("");
  else API.LMSInitialize("");
}

// Mark Incomplete
function markIncomplete() {
  if (!API) return;

  if (API.SetValue) {
    API.SetValue("cmi.completion_status", "incomplete");
    API.Commit("");
  } else {
    API.LMSSetValue("cmi.core.lesson_status", "incomplete");
    API.LMSCommit("");
  }
}

// Mark Complete
function markComplete() {
  if (!API) return;

  if (API.SetValue) {
    API.SetValue("cmi.completion_status", "completed");
    API.SetValue("cmi.success_status", "passed");
    API.Commit("");
  } else {
    API.LMSSetValue("cmi.core.lesson_status", "completed");
    API.LMSCommit("");
  }
}

// Exit
window.addEventListener("beforeunload", () => {
  if (!API) return;

  if (API.Terminate) API.Terminate("");
  else API.LMSFinish("");
});