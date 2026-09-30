#!/usr/bin/env python3
"""Assemble the Course 1 / Module 3 (Public Wi-Fi) SCORM package.

module3/ holds this course's own files — its questions, its page, its SCORM
adapter. player.js/player.css and quiz.js/quiz.css are shared with the other
modules and are copied in from the repo root, so the playback rules and the
assessment engine cannot drift between courses.
"""
import os, shutil, subprocess, sys

ROOT   = os.path.dirname(os.path.abspath(__file__))
PKG    = os.path.join(ROOT, "module3")
ZIP    = os.path.join(ROOT, "VCPL_C1_M3_PublicWiFi_SCORM.zip")
VIDEO  = os.path.join(ROOT, "content", "SepSandeepTeam", "web", "VCPL_C1_M3_PublicWiFi.mp4")
LOGO   = os.path.join(ROOT, "images", "logo", "GBL_VALVOLINE_LOGO_HORIZONTAL_RGB.png")
SHARED = ["player.js", "player.css", "quiz.js", "quiz.css"]
# The SCORM adapter is shared too, but lands under the name the page loads.
SHARED_AS = {"scorm-quiz.js": "scorm.js"}

sys.path.insert(0, ROOT)
from build_video_course import verify   # same package checks as the other builds


def main():
    for name in SHARED:
        shutil.copy2(os.path.join(ROOT, name), os.path.join(PKG, name))
    for src, dst in SHARED_AS.items():
        shutil.copy2(os.path.join(ROOT, src), os.path.join(PKG, dst))

    os.makedirs(os.path.join(PKG, "content"), exist_ok=True)
    os.makedirs(os.path.join(PKG, "images", "logo"), exist_ok=True)
    shutil.copy2(VIDEO, os.path.join(PKG, "content", os.path.basename(VIDEO)))
    shutil.copy2(LOGO, os.path.join(PKG, "images", "logo", os.path.basename(LOGO)))

    verify(PKG)

    if os.path.exists(ZIP):
        os.remove(ZIP)
    subprocess.run(["zip", "-r", "-X", ZIP, ".", "-x", ".DS_Store", "-x", "__MACOSX/*"],
                   cwd=PKG, check=True, stdout=subprocess.DEVNULL)
    print(f"  {os.path.basename(ZIP)}  {os.path.getsize(ZIP)/1048576:.0f} MB   "
          f"\"Cybersecurity Basics · Module 3 – Public Wi-Fi Dangers\"")


if __name__ == "__main__":
    main()
