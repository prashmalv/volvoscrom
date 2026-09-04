#!/usr/bin/env python3
"""Render the video-only course template into a self-contained SCORM package.

Both Engine Oil packages come from one template so they cannot drift apart.
Usage:  build_video_course.py <out_dir> <video_src> <ID> <TITLE> <BRAND>
"""
import os, re, shutil, subprocess, sys, xml.etree.ElementTree as ET

ROOT     = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(ROOT, "video-course-template")
LOGO     = os.path.join(ROOT, "images", "logo", "GBL_VALVOLINE_LOGO_HORIZONTAL_RGB.png")
NS       = "{http://www.imsproject.org/xsd/imscp_rootv1p1p2}"


def build(out_dir, video_src, ident, title, brand):
    out_dir = os.path.join(ROOT, out_dir)
    video   = os.path.basename(video_src)
    tokens  = {"{{TITLE}}": title, "{{BRAND}}": brand,
               "{{ID}}": ident, "{{VIDEO}}": video}

    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(os.path.join(out_dir, "content"))
    os.makedirs(os.path.join(out_dir, "images", "logo"))

    for name in os.listdir(TEMPLATE):
        text = open(os.path.join(TEMPLATE, name), encoding="utf-8").read()
        for tok, val in tokens.items():
            text = text.replace(tok, val)
        left = re.findall(r"\{\{[A-Z_]+\}\}", text)
        assert not left, f"{name}: unreplaced tokens {set(left)}"
        open(os.path.join(out_dir, name), "w", encoding="utf-8").write(text)

    shutil.copy2(video_src, os.path.join(out_dir, "content", video))
    shutil.copy2(LOGO, os.path.join(out_dir, "images", "logo", os.path.basename(LOGO)))

    verify(out_dir)
    zip_path = out_dir + "_SCORM.zip"
    if os.path.exists(zip_path):
        os.remove(zip_path)
    subprocess.run(["zip", "-r", "-X", zip_path, ".",
                    "-x", ".DS_Store", "-x", "__MACOSX/*"],
                   cwd=out_dir, check=True, stdout=subprocess.DEVNULL)
    print(f"  {os.path.basename(zip_path)}  "
          f"{os.path.getsize(zip_path)/1048576:.0f} MB   \"{title}\"")
    return zip_path


def verify(pkg):
    """Manifest must be at the root, and every declared file must exist."""
    manifest = os.path.join(pkg, "imsmanifest.xml")
    assert os.path.isfile(manifest), "imsmanifest.xml missing from package root"
    res = ET.parse(manifest).getroot().find(f"{NS}resources/{NS}resource")

    declared = {f.get("href") for f in res.iter(f"{NS}file")}
    on_disk  = {os.path.relpath(os.path.join(d, f), pkg)
                for d, _, fs in os.walk(pkg) for f in fs if f != "imsmanifest.xml"}
    assert not declared - on_disk, f"declared but missing: {sorted(declared - on_disk)}"
    assert not on_disk - declared, f"present but undeclared: {sorted(on_disk - declared)}"

    launch = res.get("href")
    assert os.path.isfile(os.path.join(pkg, launch)), f"launch file {launch} missing"

    html = open(os.path.join(pkg, "index.html"), encoding="utf-8").read()
    refs = {r for r in re.findall(r'(?:src|href)="([^"]+)"', html)
            if not r.startswith(("http", "#", "data:"))}
    broken = [r for r in refs if not os.path.exists(os.path.join(pkg, r))]
    assert not broken, f"broken references in index.html: {broken}"


if __name__ == "__main__":
    build(*sys.argv[1:6])
