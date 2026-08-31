# Where does a producer's cutout actually start, horizontally, at a given stage
# row? Read straight from the PNG/WebP alpha so the answer does not depend on
# rendering, then map it into the 1600x900 stage using that producer's
# left / bottom / height.
#
# Usage: python silhouette-edge.py <arquivo> <left> <bottom> <height> <y...>
#   left/bottom are NET stage coords (portrait.left + shift.x), y are stage rows.
import sys
import numpy as np
from PIL import Image

path, left, bottom, height = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
rows = [float(v) for v in sys.argv[5:]]

im = Image.open(path).convert("RGBA")
a = np.asarray(im)[:, :, 3]
NH, NW = a.shape
k = height / NH            # stage px per natural px
width = NW * k
top = 900 - (bottom + height)   # stage y of the image's top edge

print(f"{path}  natural {NW}x{NH}   escala {k:.4f}")
print(f"   no palco: x {left:.1f}..{left + width:.1f} (larg {width:.1f})   y {top:.1f}..{top + height:.1f}")
opaque = a > 40
colsany = np.where(opaque.any(axis=0))[0]
rowsany = np.where(opaque.any(axis=1))[0]
print(f"   silhueta dentro do arquivo: x {colsany.min()}..{colsany.max()}  y {rowsany.min()}..{rowsany.max()}")
print(f"   => silhueta no palco: x {left + colsany.min()*k:.1f}..{left + colsany.max()*k:.1f}")
for sy in rows:
    ny = int(round((sy - top) / k))
    if ny < 0 or ny >= NH:
        print(f"   y {sy:6.0f}: fora da imagem")
        continue
    xs = np.where(opaque[ny])[0]
    if not len(xs):
        print(f"   y {sy:6.0f}: linha vazia")
        continue
    print(f"   y {sy:6.0f}: borda esquerda no palco x {left + xs.min()*k:7.1f}   direita {left + xs.max()*k:7.1f}")
