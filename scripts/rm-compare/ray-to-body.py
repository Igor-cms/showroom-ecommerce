# How long should a leader line be so it just touches the producer's body?
# March the ray from the pill's edge until the cutout's alpha turns opaque, so
# the answer comes from the artwork itself instead of from eyeballing a render.
#
# Usage: python ray-to-body.py <arquivo> <left> <bottom> <height> <x0> <y0> <graus>
#   left/bottom  NET stage coords (portrait.left + shift.x)
#   x0,y0        where the line starts (pill right edge + 7, pill vertical centre)
import sys
import numpy as np
from PIL import Image

path = sys.argv[1]
left, bottom, height = (float(v) for v in sys.argv[2:5])
x0, y0, deg = (float(v) for v in sys.argv[5:8])

a = np.asarray(Image.open(path).convert("RGBA"))[:, :, 3]
NH, NW = a.shape
k = height / NH
top = 900 - (bottom + height)
th = np.radians(deg)
dx, dy = np.cos(th), np.sin(th)

hit = None
for step in np.arange(0, 800, 0.5):
    sx, sy = x0 + dx * step, y0 + dy * step
    nx, ny = int(round((sx - left) / k)), int(round((sy - top) / k))
    if 0 <= nx < NW and 0 <= ny < NH and a[ny, nx] > 40:
        hit = (step, sx, sy)
        break

if hit:
    step, sx, sy = hit
    print(f"   inicio ({x0:.1f}, {y0:.1f}) a {deg:g} graus  ->  toca o corpo em ({sx:.1f}, {sy:.1f})")
    print(f"   COMPRIMENTO {step:.1f}")
else:
    print(f"   inicio ({x0:.1f}, {y0:.1f}) a {deg:g} graus  ->  nao encontra o corpo em 800px")
