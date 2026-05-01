// Test app — no skip prevention, no quiz, only completion tracking
const video = document.getElementById("video");
let completionShown = false;

// Fullscreen toggle
const playerWrapper = document.getElementById("playerWrapper");

function toggleFullscreen() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fsEl) {
    (playerWrapper.requestFullscreen || playerWrapper.webkitRequestFullscreen).call(playerWrapper);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
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

function showThankYou() {
  if (completionShown) return;
  completionShown = true;
  video.pause();
  document.getElementById("thankYouScreen").classList.remove("hidden");
  if (typeof markComplete === "function") markComplete();
}

video.addEventListener("ended", showThankYou);

// Visibility guard — pause on hide, resume on return
let awayTimer = null;
let pausedByVisibility = false;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (!video.paused && !completionShown) {
      video.pause();
      pausedByVisibility = true;
    }
    awayTimer = setTimeout(() => {
      if (typeof markIncomplete === "function") markIncomplete();
    }, 5000);
  } else {
    clearTimeout(awayTimer);
    if (pausedByVisibility && !completionShown) {
      pausedByVisibility = false;
      video.play().catch(() => {});
    } else {
      pausedByVisibility = false;
    }
  }
});
