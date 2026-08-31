# Compare the producer's framing between the client reference and our render by
# isolating the CAP — a compact dark mass sitting against bright fog, so it is
# far more separable than the whole silhouette (the forest is dark too).
# Width and centre are reported as a FRACTION of frame width, which is the only
# thing comparable across two different canvas systems.
import sys
import numpy as np
from PIL import Image


def cap_box(path, thr=110):
    im = Image.open(path).convert("L")
    a = np.asarray(im).astype(np.int16)
    H, W = a.shape
    # The cap lives in the upper third, right half of the frame.
    ys, ye = int(H * 0.05), int(H * 0.35)
    xs = int(W * 0.55)
    win = a[ys:ye, xs:] < thr
    if win.sum() < 50:
        return None, (W, H)
    # Largest connected-ish blob by column/row density, to shrug off stray text.
    cols = np.where(win.sum(axis=0) > 3)[0]
    rows = np.where(win.sum(axis=1) > 3)[0]
    if not len(cols) or not len(rows):
        return None, (W, H)
    # Take the widest run of consecutive dense columns (the cap), ignoring gaps.
    runs, start = [], cols[0]
    for i in range(1, len(cols)):
        if cols[i] != cols[i - 1] + 1:
            runs.append((start, cols[i - 1]))
            start = cols[i]
    runs.append((start, cols[-1]))
    c0, c1 = max(runs, key=lambda r: r[1] - r[0])
    sub = win[:, c0:c1 + 1]
    srows = np.where(sub.sum(axis=1) > 3)[0]
    return (c0 + xs, c1 + xs, srows.min() + ys, srows.max() + ys), (W, H)


for path in sys.argv[1:]:
    box, (W, H) = cap_box(path)
    if not box:
        print(f"{path}: bone nao encontrado")
        continue
    L, R, T, B = box
    print(f"{path}  ({W}x{H})")
    print(f"   bone: x {L}..{R}  y {T}..{B}")
    print(f"   largura {(R-L+1)/W:.4f} da moldura   centro x {(L+R)/2/W:.4f}   topo y {T/H:.4f}")
