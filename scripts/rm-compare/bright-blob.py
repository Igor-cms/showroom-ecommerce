# Locate a BRIGHT mark (e.g. the white chest logo) inside a search window.
# Paired with the cap measurement it gives two well-separated landmarks, which
# is a far more robust size proxy than either one alone.
# Usage: python bright-blob.py <img> <x0> <x1> <y0> <y1> [limiar]
import sys
import numpy as np
from PIL import Image

path = sys.argv[1]
x0, x1, y0, y1 = (float(v) for v in sys.argv[2:6])
thr = int(sys.argv[6]) if len(sys.argv) > 6 else 200

a = np.asarray(Image.open(path).convert("L")).astype(np.int16)
H, W = a.shape
xs, xe, ys, ye = int(W * x0), int(W * x1), int(H * y0), int(H * y1)
win = a[ys:ye, xs:xe] > thr
if win.sum() < 20:
    print(f"{path}: nada acima de {thr} na janela")
    sys.exit(0)
cols = np.where(win.sum(axis=0) > 1)[0]
rows = np.where(win.sum(axis=1) > 1)[0]
L, R, T, B = cols.min() + xs, cols.max() + xs, rows.min() + ys, rows.max() + ys
print(f"{path}  ({W}x{H})  janela x {xs}..{xe} y {ys}..{ye} limiar {thr}  ({win.sum()} px)")
print(f"   marca: x {L}..{R} (larg {R-L+1})   y {T}..{B} (alt {B-T+1})   centro ({(L+R)/2:.1f}, {(T+B)/2:.1f})")
