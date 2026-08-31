# Pixel diff between two screenshot sets. Usage:
#   python png-diff.py antes depois 320 375 640 767
import sys
import numpy as np
from PIL import Image

a_pre, b_pre = sys.argv[1], sys.argv[2]
worst = 0
for w in sys.argv[3:]:
    fa, fb = f"{a_pre}-{w}.png", f"{b_pre}-{w}.png"
    A = Image.open(fa).convert("RGB")
    B = Image.open(fb).convert("RGB")
    if A.size != B.size:
        print(f"{w:>5}  TAMANHO DIFERENTE  {A.size} vs {B.size}")
        worst = max(worst, 1)
        continue
    a = np.asarray(A).astype(np.int16)
    b = np.asarray(B).astype(np.int16)
    d = np.abs(a - b).max(axis=2)
    n = int((d > 8).sum())
    total = d.shape[0] * d.shape[1]
    if n:
        ys, xs = np.where(d > 8)
        print(f"{w:>5}  {n} px diferentes de {total} ({100*n/total:.3f}%)  "
              f"y {ys.min()}..{ys.max()}  x {xs.min()}..{xs.max()}  maxdelta {int(d.max())}")
    else:
        print(f"{w:>5}  identico ({A.size[0]}x{A.size[1]})")
    worst = max(worst, n)
print("\nsem regressao abaixo de lg" if worst == 0 else "\nHA DIFERENCA - investigar")
