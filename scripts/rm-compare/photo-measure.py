# Measure the client's Contact reference photo: field rules, SUBMIT bar and the
# CONTACT wordmark, then express everything in RM canvas px so it can be put
# side by side with the live Readymag numbers.
import sys
import numpy as np
from PIL import Image

path = sys.argv[1]
im = Image.open(path).convert("L")
a = np.asarray(im).astype(np.int16)
H, W = a.shape
print(f"imagem {W}x{H}")

# --- the form column: rules are long dark-ish horizontal runs on the right half
half = a[:, W // 2:]
darkish = half < 200
rowfrac = darkish.mean(axis=1)
rules = []
y = 0
while y < H:
    if rowfrac[y] > 0.55:
        y0 = y
        while y < H and rowfrac[y] > 0.55:
            y += 1
        rules.append(((y0 + y - 1) / 2, y - y0, float(rowfrac[y0:y].mean())))
    y += 1
print("\nlinhas horizontais na metade direita (y, espessura, cobertura):")
for r in rules:
    print(f"   y {r[0]:7.1f}  esp {r[1]}  cob {r[2]:.2f}")

# --- horizontal extent of the longest rule => field width
if rules:
    ry = int(rules[len(rules) // 2][0])
    row = a[ry] < 200
    xs = np.where(row)[0]
    print(f"\nregua em y={ry}: x {xs.min()}..{xs.max()}  largura {xs.max() - xs.min() + 1}")

# --- CONTACT wordmark: the tallest run of very dark pixels
verydark = a < 80
colhas = verydark.sum(axis=1)
band = np.where(colhas > 20)[0]
# restrict to the upper half to catch the wordmark, not the footer
band = band[(band > H * 0.20) & (band < H * 0.55)]
if len(band):
    y0, y1 = band.min(), band.max()
    sub = verydark[y0:y1 + 1]
    xs = np.where(sub.any(axis=0))[0]
    print(f"\nCONTACT: y {y0}..{y1} (alt {y1 - y0 + 1})  x {xs.min()}..{xs.max()} (larg {xs.max() - xs.min() + 1})")
    k = (xs.max() - xs.min() + 1) / 254.8
    print(f"escala pela palavra CONTACT: {k:.4f}   (canvas visivel {W / k:.1f} x {H / k:.1f})")
    print("\n--- em canvas-px ---")
    for i, r in enumerate(rules):
        print(f"   linha {i}: y {r[0] / k:7.2f}   esp {r[1] / k:.2f}")
    for i in range(1, len(rules)):
        print(f"   pitch {i - 1}->{i}: {(rules[i][0] - rules[i - 1][0]) / k:.2f}")
