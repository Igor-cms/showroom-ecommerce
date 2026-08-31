"""Measure Allan's silhouette + name position in OURS vs RM, both 1600x900."""
from PIL import Image
import numpy as np

def load(p):
    return np.asarray(Image.open(p).convert("RGB")).astype(np.int16)

def dark_bbox(im, x0):
    """Bounding box of dark (shirt/jeans) pixels in the right region x>=x0."""
    r, g, b = im[:, :, 0], im[:, :, 1], im[:, :, 2]
    lum = (r + g + b) / 3
    mask = (lum < 85)
    mask[:, :x0] = False           # ignore left side (header text etc.)
    mask[:60, :] = False           # ignore header band
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    return dict(left=int(xs.min()), right=int(xs.max()),
               top=int(ys.min()), bottom=int(ys.max()),
               cx=int(xs.mean()), n=int(len(xs)))

def cream_name_bbox(im):
    """Bright cream text 'ALLAN HARTMANN' in the center band (y 240-330)."""
    r, g, b = im[:, :, 0], im[:, :, 1], im[:, :, 2]
    mask = (r > 200) & (g > 195) & (b > 165) & (b < 235)
    band = np.zeros_like(mask)
    band[240:335, 400:1050] = True
    mask = mask & band
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    return dict(left=int(xs.min()), right=int(xs.max()),
               top=int(ys.min()), bottom=int(ys.max()),
               cx=int((xs.min()+xs.max())//2), n=int(len(xs)))

DIR = r"C:\Users\erick\OneDrive\Documentos\lovably-crafted-pixels\scripts"
ours = load(DIR + r"\producers-allan.png")
rm   = load(DIR + r"\rm-producers\scene-step6.png")
print("ours size", ours.shape, "rm size", rm.shape)

for name, im in [("OURS", ours), ("RM  ", rm)]:
    body = dark_bbox(im, 1000)
    nm = cream_name_bbox(im)
    print(f"\n== {name} ==")
    print("  body:", body)
    print("  name:", nm)

ob, rb = dark_bbox(ours, 1000), dark_bbox(rm, 1000)
on, rn = cream_name_bbox(ours), cream_name_bbox(rm)
print("\n== DELTAS (ours - rm), positive = ours is right/lower ==")
print(f"  body left : {ob['left']-rb['left']:+d}")
print(f"  body cx   : {ob['cx']-rb['cx']:+d}")
print(f"  body top  : {ob['top']-rb['top']:+d}")
print(f"  body height ours={ob['bottom']-ob['top']} rm={rb['bottom']-rb['top']}  d={(ob['bottom']-ob['top'])-(rb['bottom']-rb['top']):+d}")
print(f"  name cx   : {on['cx']-rn['cx']:+d}")
print(f"  name top  : {on['top']-rn['top']:+d}")
