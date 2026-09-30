#!/usr/bin/env python3
"""Assemble a quiz-bearing SCORM package.

The module directory holds only what is specific to that course — its
questions, its page, its manifest. player.js/player.css, quiz.js/quiz.css and
the SCORM adapter are shared with every other module and copied in from the
repo root, so playback, assessment and reporting cannot drift between courses.

Usage:  build_quiz_course.py <module_dir> <video_src> <zip_name> <label>
"""
import os, shutil, subprocess, sys

ROOT   = os.path.dirname(os.path.abspath(__file__))
LOGO   = os.path.join(ROOT, "images", "logo", "GBL_VALVOLINE_LOGO_HORIZONTAL_RGB.png")
SHARED = ["player.js", "player.css", "quiz.js", "quiz.css"]
SHARED_AS = {"scorm-quiz.js": "scorm.js"}

sys.path.insert(0, ROOT)
from build_video_course import verify


def build(module_dir, video_src, zip_name, label):
    pkg = os.path.join(ROOT, module_dir)
    zip_path = os.path.join(ROOT, zip_name)

    for name in SHARED:
        shutil.copy2(os.path.join(ROOT, name), os.path.join(pkg, name))
    for src, dst in SHARED_AS.items():
        shutil.copy2(os.path.join(ROOT, src), os.path.join(pkg, dst))

    os.makedirs(os.path.join(pkg, "content"), exist_ok=True)
    os.makedirs(os.path.join(pkg, "images", "logo"), exist_ok=True)
    shutil.copy2(os.path.join(ROOT, video_src), os.path.join(pkg, "content", os.path.basename(video_src)))
    shutil.copy2(LOGO, os.path.join(pkg, "images", "logo", os.path.basename(LOGO)))

    verify(pkg)

    if os.path.exists(zip_path):
        os.remove(zip_path)
    subprocess.run(["zip", "-r", "-X", zip_path, ".", "-x", ".DS_Store", "-x", "__MACOSX/*"],
                   cwd=pkg, check=True, stdout=subprocess.DEVNULL)
    print(f"  {zip_name}  {os.path.getsize(zip_path)/1048576:.0f} MB   \"{label}\"")


if __name__ == "__main__":
    build(*sys.argv[1:5])
