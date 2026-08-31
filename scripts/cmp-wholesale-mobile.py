"""Side-by-side: our mobile /wholesale-request vs the client's Iteration-2 p21
reference, aligned on the SAME content span (the CITY field down to the start of
the programme details) so type sizes, rhythm and the submit bar compare directly.
"""
import os
import numpy as np
from PIL import Image

S = r"C:\Users\erick\OneDrive\Documentos\lovably-crafted-pixels\scripts"
OUT = r"C:\Users\erick\AppData\Local\Temp\claude\C--Users-erick-OneDrive-Documentos-lovably-crafted-pixels\89ae3d86-63d1-459e-ab55-40c42b050096\scratchpad"

ours = Image.open(os.path.join(S, "wholesale-mobile-after.png")).convert("RGB")
ref = Image.open(os.path.join(OUT, "it2-p21.png")).convert("RGB").crop((163, 213, 573, 940))

def submit_band(im, tol=12):
    """Row range of the taupe SUBMIT bar (#BCB7A8-ish), used as the anchor.

    The page ground is a near neighbour of that taupe, so a plain min/max over
    matching rows drifts onto the background. Group the matches into contiguous
    runs instead and take the SHORTEST plausible one — the bar is a thin band,
    the background is not.
    """
    a = np.asarray(im).astype(int)
    m = (abs(a[:, :, 0] - 188) < tol) & (abs(a[:, :, 1] - 183) < tol) & (abs(a[:, :, 2] - 168) < tol)
    rows = np.where(m.sum(axis=1) > im.width * 0.6)[0]
    if not len(rows):
        return None
    runs, cur = [], [rows[0]]
    for y in rows[1:]:
        if y == cur[-1] + 1:
            cur.append(y)
        else:
            runs.append(cur); cur = [y]
    runs.append(cur)
    bar = min(runs, key=len)
    return (bar[0], bar[-1])

ob, rb = submit_band(ours), submit_band(ref)
print("submit band  ours:", ob, " ref:", rb)

# Normalise both to the same width, then window each around its submit bar so the
# same span of the page is visible on both sides.
W = 470
def fit(im):
    return im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)

def window(im, band, up, down):
    s = W / im.width
    c = (band[0] + band[1]) / 2 * s
    im = fit(im)
    return im.crop((0, max(0, int(c - up)), W, min(im.height, int(c + down))))

a = window(ours, ob, 470, 240)
b = window(ref, rb, 470, 240)

H = max(a.height, b.height)
canvas = Image.new("RGB", (W * 2 + 24, H), (28, 28, 28))
canvas.paste(a, (0, 0))
canvas.paste(b, (W + 24, 0))
p = os.path.join(OUT, "cmp-wholesale.png")
canvas.save(p)
print(p, canvas.size, "| left=OURS right=REFERENCE (aligned on the SUBMIT bar)")
