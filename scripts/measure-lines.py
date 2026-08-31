"""Detect the cream hotspot pills (MY STORY / INTERVIEW|HOT TAKES / MY COFFEES)
in a scene frame and report each pill's x-left, x-right, x-center, y-center, width.
Cream ~ rgb(255,251,228). We look below the name band (y>360) for small text
clusters, group them into horizontal bands, and split each band into left/right
pills if two producers are on screen."""
from PIL import Image
import numpy as np
import sys

def cream_mask(im):
    r, g, b = im[:, :, 0], im[:, :, 1], im[:, :, 2]
    return (r > 205) & (g > 200) & (b > 165) & (b < 240) & (abs(r - g) < 25)

def bands(path, ytop=360, ybot=860):
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    H, W = im.shape[:2]
    m = cream_mask(im)
    m[:ytop, :] = False
    m[ybot:, :] = False
    rows = m.sum(axis=1)
    # find contiguous row-bands with cream
    out = []
    y = 0
    while y < H:
        if rows[y] > 3:
            y0 = y
            while y < H and rows[y] > 1:
                y += 1
            y1 = y
            # within this y-band, find x clusters
            sub = m[y0:y1, :]
            cols = sub.sum(axis=0)
            xs = np.where(cols > 1)[0]
            if len(xs):
                # split into clusters separated by gaps > 120px
                clusters = []
                start = xs[0]; prev = xs[0]
                for x in xs[1:]:
                    if x - prev > 120:
                        clusters.append((start, prev)); start = x
                    prev = x
                clusters.append((start, prev))
                for (xl, xr) in clusters:
                    if xr - xl < 25:   # ignore tiny specks
                        continue
                    out.append(dict(yc=(y0+y1)//2, xl=int(xl), xr=int(xr),
                                    xc=int((xl+xr)//2), w=int(xr-xl), h=int(y1-y0)))
        else:
            y += 1
    return out, (W, H)

for path in sys.argv[1:]:
    b, (W, H) = bands(path)
    print(f"\n=== {path.split(chr(92))[-1]}  ({W}x{H}) ===")
    for r in b:
        print(f"  y={r['yc']:>3}  x[{r['xl']:>4}..{r['xr']:>4}] xc={r['xc']:>4} w={r['w']:>3} h={r['h']}")
