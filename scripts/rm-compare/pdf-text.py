import fitz, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
d = fitz.open(r"C:\Users\erick\Downloads\Iteration 2 - Changes To New Web.pdf")
for i in range(int(sys.argv[1])-1, int(sys.argv[2])):
    t = d[i].get_text()
    lines = [x.strip() for x in t.split("\n") if x.strip() and x.strip() != "-"]
    print(f"\n{'='*70}\nPAGINA {i+1}   ({len(d[i].get_images(full=True))} imagem/ns)\n{'='*70}")
    print("\n".join(lines))
