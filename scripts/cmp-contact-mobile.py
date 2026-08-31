"""Side-by-side: our mobile /contact vs the client's Iteration-2 reference,
normalised to the same pixel width so type sizes and margins compare directly."""
import os
from PIL import Image

S = r"C:\Users\erick\OneDrive\Documentos\lovably-crafted-pixels\scripts"
OUT = r"C:\Users\erick\AppData\Local\Temp\claude\C--Users-erick-OneDrive-Documentos-lovably-crafted-pixels\89ae3d86-63d1-459e-ab55-40c42b050096\scratchpad"

ours = Image.open(os.path.join(S, "contact-mobile-after.png")).convert("RGB")
# reference phone screen inside the PDF page render (scale 2.4)
ref = Image.open(os.path.join(OUT, "it2-p22.png")).convert("RGB").crop((186, 208, 590, 920))

W = 520
def fit(im):
    return im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)

a, b = fit(ours), fit(ref)
H = max(a.height, b.height)
canvas = Image.new("RGB", (W * 2 + 24, H), (28, 28, 28))
canvas.paste(a, (0, 0))
canvas.paste(b, (W + 24, 0))
p = os.path.join(OUT, "cmp-contact-mobile.png")
canvas.save(p)
print(p, canvas.size, "| left=OURS right=REFERENCE")
