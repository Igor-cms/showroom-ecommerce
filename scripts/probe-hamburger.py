"""Measure the hamburger crops captured by probe-hamburger.cjs.

Answers two questions with pixels, not theory:
  1) do the two bars rasterise IDENTICALLY (same rows, same ink) at every
     width x device-pixel-ratio, and
  2) does the icon keep Readymag's proportions (pitch:width) as the screen grows.
"""
import json
import os
from PIL import Image
import numpy as np

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ham-probe")
RM_RATIO = 5 / 26  # Readymag: 5px pitch on a 26px-wide icon


def bars(path):
    """Group inked rows into bars: [(rowcount, [ink per row]), ...]."""
    im = np.asarray(Image.open(path).convert("RGB")).astype(float).mean(axis=2)
    bg = np.median(im[-1])
    rows = []
    for y, row in enumerate(im):
        dark = row[row < bg - 8]
        if dark.size > 2:
            rows.append((y, dark.size, round(float(dark.mean()), 1)))
    out, cur = [], []
    for r in rows:
        if cur and r[0] != cur[-1][0] + 1:
            out.append(cur)
            cur = []
        cur.append(r)
    if cur:
        out.append(cur)
    return out


geom = json.load(open(os.path.join(DIR, "geometry.json")))
widths = sorted({g["vw"] for g in geom.values()})
dprs = sorted({g["dpr"] for g in geom.values()})

print(f"{'width':>5}  {'iconW':>6}  {'pitch':>5}  {'ratio':>5}   (RM {RM_RATIO:.3f})   bars identical per dpr")
bad = 0
for w in widths:
    marks, ratio_txt = [], "  -  "
    for d in dprs:
        key = f"{w}x{d}"
        p = os.path.join(DIR, key + ".png")
        if not os.path.exists(p):
            marks.append(f"{d}??")
            bad += 1
            continue
        b = bars(p)
        same = (
            len(b) == 2
            and len(b[0]) == len(b[1])
            and [r[2] for r in b[0]] == [r[2] for r in b[1]]
        )
        if not same:
            bad += 1
        marks.append(f"{d}{'OK' if same else 'XX'}")
        if d == 2 and len(b) == 2:
            pitch = (b[1][0][0] - b[0][0][0]) / d
            iw = geom[key]["w"]
            ratio_txt = f"{pitch / iw:.3f}"
            width_txt, pitch_txt = f"{iw:.2f}", f"{pitch:.2f}"
    print(f"{w:>5}  {width_txt:>6}  {pitch_txt:>5}  {ratio_txt:>5}                 {'  '.join(marks)}")

print()
print("ALL BARS RENDER IDENTICALLY" if bad == 0 else f"{bad} MISMATCH(ES)")
