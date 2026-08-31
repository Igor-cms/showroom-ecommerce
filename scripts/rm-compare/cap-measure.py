# Measure a producer's CAP (dark mass against bright fog) inside an explicit
# search window, and report it as a fraction of the frame so a Readymag
# reference and our render can be compared at different pixel sizes.
#
# Usage: python cap-measure.py <img> <x0> <x1> <y0> <y1> [limiar]
#   x0..y1 are FRACTIONS of the frame. Always eyeball the printed box against
#   the image once — this detector has been wrong before (it reported -4% when
#   the DOM said +8%), so treat a lone number with suspicion.
import sys
import numpy as np
from PIL import Image

path = sys.argv[1]
x0, x1, y0, y1 = (float(v) for v in sys.argv[2:6])
thr = int(sys.argv[6]) if len(sys.argv) > 6 else 110

im = Image.open(path).convert("L")
a = np.asarray(im).astype(np.int16)
H, W = a.shape
xs, xe = int(W * x0), int(W * x1)
ys, ye = int(H * y0), int(H * y1)
win = a[ys:ye, xs:xe] < thr

if win.sum() < 40:
    print(f"{path}: nada abaixo de {thr} na janela")
    sys.exit(0)

cols = np.where(win.sum(axis=0) > 2)[0]
rows = np.where(win.sum(axis=1) > 2)[0]
# Widest run of consecutive dense columns = the cap, ignoring stray marks.
runs, start = [], cols[0]
for i in range(1, len(cols)):
    if cols[i] != cols[i - 1] + 1:
        runs.append((start, cols[i - 1]))
        start = cols[i]
runs.append((start, cols[-1]))
c0, c1 = max(runs, key=lambda r: r[1] - r[0])
sub = win[:, c0:c1 + 1]
srows = np.where(sub.sum(axis=1) > 2)[0]
L, R = c0 + xs, c1 + xs
T, B = srows.min() + ys, srows.max() + ys

print(f"{path}  ({W}x{H})   janela x {xs}..{xe}  y {ys}..{ye}  limiar {thr}")
print(f"   bone px: x {L}..{R} (larg {R-L+1})   y {T}..{B} (alt {B-T+1})")
print(f"   FRACAO  largura {(R-L+1)/W:.4f}   centro x {(L+R)/2/W:.4f}   topo y {T/H:.4f}")
