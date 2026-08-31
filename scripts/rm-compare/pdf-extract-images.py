import fitz, sys
d = fitz.open(r"C:\Users\erick\Downloads\Iteration 2 - Changes To New Web.pdf")
for p in [int(x) for x in sys.argv[1:]]:
    pg = d[p-1]
    for n, info in enumerate(pg.get_images(full=True)):
        xref = info[0]
        img = d.extract_image(xref)
        fn = f"ref-p{p}-{n}.{img['ext']}"
        open(fn,'wb').write(img['image'])
        print(fn, img['width'], 'x', img['height'], 'placed:', pg.get_image_rects(xref))
