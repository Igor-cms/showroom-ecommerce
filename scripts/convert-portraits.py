import os
from PIL import Image

base = r"C:\Users\erick\Downloads\RM\PJ\img\62c4b2b0cb3822001bb504bc\5180650"
out = r"C:\Users\erick\OneDrive\Documentos\lovably-crafted-pixels\public\producers"

for src, dst in [("GNFwfPXR1VO13lrZkc4pI.png", "diego-rm.png"),
                 ("8YOVDPBBCQlvAZRIbN-6X.png", "diana-rm.png")]:
    im = Image.open(os.path.join(base, src)).convert("RGBA")
    bbox = im.split()[3].getbbox()  # tight crop to non-transparent content
    print(src, "orig", im.size, "content bbox", bbox)
    im = im.crop(bbox)
    im.save(os.path.join(out, dst))
    print("  saved", dst, im.size, "aspect %.3f" % (im.size[0] / im.size[1]))
