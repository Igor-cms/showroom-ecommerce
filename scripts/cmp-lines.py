import os
from PIL import Image
S = r"C:\Users\erick\OneDrive\Documentos\lovably-crafted-pixels\scripts"
OUT = r"C:\Users\erick\AppData\Local\Temp\claude\C--Users-erick-OneDrive-Documentos-lovably-crafted-pixels\89ae3d86-63d1-459e-ab55-40c42b050096\scratchpad"

def sbs(our, ourbox, rm, rmbox, name):
    a = Image.open(our).crop(ourbox)
    b = Image.open(rm).crop(rmbox)
    h = max(a.height, b.height)
    c = Image.new("RGB", (a.width + b.width + 20, h), (20, 20, 20))
    c.paste(a, (0, 0))
    c.paste(b, (a.width + 20, 0))
    p = os.path.join(OUT, name)
    c.save(p)
    print(p, c.size)

# Diana: our body ~570 -> crop 250-870 ; RM body ~760 -> crop 440-1060 (both 620 wide)
sbs(S + r"\producers-diana.png", (250, 380, 870, 780),
    S + r"\rm-producers\scene-step2.png", (440, 380, 1060, 780), "cmp-diana.png")
# Allan: our body ~1150 -> crop 830-1330 ; RM body ~1180 -> crop 800-1300
sbs(S + r"\producers-allan.png", (830, 380, 1330, 780),
    S + r"\rm-producers\scene-step6.png", (800, 380, 1300, 780), "cmp-allan.png")
