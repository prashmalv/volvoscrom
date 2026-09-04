#!/usr/bin/env python3
"""Assemble the Course 1 / Module 1 (Password Hygiene) SCORM package.

module1/ holds this course's own files; player.js and player.css are
shared with the video-only courses and are copied in from the repo root,
so the two never drift apart.
"""
import os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PKG  = os.path.join(ROOT, "module1")
ZIP  = os.path.join(ROOT, "VCPL_C1_M1_PasswordHygiene_SCORM.zip")
SHARED = ["player.js", "player.css"]

sys.path.insert(0, ROOT)
from build_video_course import verify   # same package checks as the other builds


def main():
    for name in SHARED:
        shutil.copy2(os.path.join(ROOT, name), os.path.join(PKG, name))

    verify(PKG)

    if os.path.exists(ZIP):
        os.remove(ZIP)
    subprocess.run(["zip", "-r", "-X", ZIP, ".",
                    "-x", ".DS_Store", "-x", "__MACOSX/*"],
                   cwd=PKG, check=True, stdout=subprocess.DEVNULL)
    print(f"  {os.path.basename(ZIP)}  {os.path.getsize(ZIP)/1048576:.0f} MB   "
          f"\"Cybersecurity Basics · Module 1 – Password Hygiene\"")


if __name__ == "__main__":
    main()
