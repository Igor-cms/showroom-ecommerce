# Width of a dark mass row by row inside a window, and the widest row found.
# For a cap this lands on the brim, which is the most repeatable size landmark
# on these frames — unlike a bounding box, it cannot be inflated by the hair or
# face merging into the blob.
# Usage: python widest-row.py <img> <x0px> <x1px> <y0px> <y1px> [limiar]
import sys
import numpy as np
from PIL import Image

path = sys.argv[1]
x0, x1, y0, y1 = (int(v) for v in sys.argv[2:6])
thr = int(sys.argv[6]) if len(sys.argv) > 6 else 175

a = np.asarray(Image.open(path).convert("L")).astype(np.int16)
win = a[y0:y1, x0:x1] < thr
best = (0, None)
print(f"{path}   janela x {x0}..{x1} y {y0}..{y1} limiar {thr}")
for i in range(win.shape[0]):
    xs = np.where(win[i])[0]
    if len(xs) < 5:
        continue
    w = xs.max() - xs.min() + 1
    if w > best[0]:
        best = (w, (y0 + i, x0 + xs.min(), x0 + xs.max()))
    if i % 8 == 0:
        print(f"   y {y0+i:4d}  x {x0+xs.min():4d}..{x0+xs.max():4d}  larg {w}")
if best[1]:
    y, l, r = best[1]
    print(f"   >>> linha mais larga: y {y}  x {l}..{r}  LARGURA {best[0]}")
