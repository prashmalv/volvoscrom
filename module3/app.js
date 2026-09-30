// ─────────────────────────────────────────────────────────────────
//  VCPL · Course 1 / Module 3 — Public Wi-Fi & Rogue Hotspots
//  player.js owns playback, quiz.js owns the assessment. All that is
//  left here is the page's own chrome.
// ─────────────────────────────────────────────────────────────────
const playerWrapper = document.getElementById("playerWrapper");

function toggleFullscreen() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fsEl) {
    const req = playerWrapper.requestFullscreen || playerWrapper.webkitRequestFullscreen;
    if (req) req.call(playerWrapper);
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document);
  }
}

document.addEventListener("fullscreenchange", updateFsIcon);
document.addEventListener("webkitfullscreenchange", updateFsIcon);

function updateFsIcon() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  const icon = document.getElementById("fsIcon");
  if (!icon) return;
  icon.innerHTML = isFs
    ? '<path d="M5.5 0h-4v4h1.5v-2.5h2.5v-1.5zm5 0h4v4h-1.5v-2.5h-2.5v-1.5zm-5 16h-4v-4h1.5v2.5h2.5v1.5zm9-4h-1.5v2.5h-2.5v1.5h4v-4z"/>'
    : '<path d="M1.5 1h4v1.5h-2.5v2.5h-1.5v-4zm9 0h4v4h-1.5v-2.5h-2.5v-1.5zm-9 9h1.5v2.5h2.5v1.5h-4v-4zm11.5 2.5v-2.5h1.5v4h-4v-1.5h2.5z"/>';
}
