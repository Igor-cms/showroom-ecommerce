// Compare our /blog desktop against the RM canvas (1024) scaled to 1440.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const K = 1440 / 1024; // 1.40625
const route = process.argv[2] || "/blog";

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080" + route, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  const g = await page.evaluate(() => {
    const sec = document.querySelector("main > section");
    const h1 = sec.querySelector("h1");
    const yrs = [...sec.querySelectorAll("button")];
    const inp = sec.querySelector("input");
    const card = document.querySelector("article");
    const photo = card.children[0];
    const cap = card.children[1];
    const head = cap.querySelector("h3");
    const exc = cap.querySelector("p");
    const pill = cap.querySelector("a");
    const R = (e) => { const r = e.getBoundingClientRect(); return { x: +r.left.toFixed(1), y: +(r.top + scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), r2: +r.right.toFixed(1), b: +(r.bottom + scrollY).toFixed(1) }; };
    const F = (e) => { const c = getComputedStyle(e); return { fs: +parseFloat(c.fontSize).toFixed(2), lh: c.lineHeight, ls: c.letterSpacing, ff: c.fontFamily.split(",")[0].replace(/['"]/g, ""), st: c.fontStyle, fw: c.fontWeight, br: c.borderRadius, bg: c.backgroundColor }; };
    return {
      title: { ...R(h1), ...F(h1) },
      years: yrs.slice(0, 3).map((e) => ({ ...R(e), ...F(e) })),
      search: { ...R(inp), ...F(inp) },
      photo: R(photo),
      head: { ...R(head), ...F(head) },
      exc: { ...R(exc), ...F(exc) },
      pill: { ...R(pill), ...F(pill) },
      col: R(card),
    };
  });

  const rm = {
    title: { x: 3, w: 148.4, fs: 25, ls: -1.5 },
    year0: { x: 162, w: 15.8, fs: 8, ls: -0.5 },
    yearPitch: 29,
    searchText: { x: 269.3, fs: 7 },
    head: { fs: 8, lh: 8, ls: -0.1, dxFromCol: 5, dyFromPhoto: 7 },
    exc: { fs: 7, lh: 8, ls: -0.1, dyFromHeadBottom: 8 },
    pill: { w: 72, h: 10, fs: 6, radius: 6, dyFromExcBottom: 7, dxFromColRight: 8 },
  };
  const row = (label, ours, target) => {
    const d = ours - target;
    const flag = Math.abs(d) > 1.2 ? "   <<<" : "";
    console.log(`${label.padEnd(30)} nosso ${String(ours.toFixed(1)).padStart(8)}   RM ${String(target.toFixed(1)).padStart(8)}   d ${(d >= 0 ? "+" : "") + d.toFixed(1)}${flag}`);
  };
  console.log("=== FAIXA DO TITULO ===");
  row("titulo x", g.title.x, rm.title.x * K);
  row("titulo largura", g.title.w, rm.title.w * K);
  row("titulo font-size", g.title.fs, rm.title.fs * K);
  row("titulo letter-spacing", parseFloat(g.title.ls), rm.title.ls * K);
  console.log(`titulo familia: nosso ${g.title.ff} | RM custom_75139`);
  row("ano1 x", g.years[0].x, rm.year0.x * K);
  row("ano largura", g.years[0].w, rm.year0.w * K);
  row("ano font-size", g.years[0].fs, rm.year0.fs * K);
  row("ano pitch", g.years[1].x - g.years[0].x, rm.yearPitch * K);
  row("SEARCH (caixa) x", g.search.x, 250 * K);
  row("SEARCH font-size", g.search.fs, rm.searchText.fs * K);
  console.log("\n=== CARD ===");
  row("cabecalho font-size", g.head.fs, rm.head.fs * K);
  row("cabecalho line-height", parseFloat(g.head.lh), rm.head.lh * K);
  row("cabecalho letter-spacing", parseFloat(g.head.ls), rm.head.ls * K);
  console.log(`cabecalho familia: nosso ${g.head.ff} | RM custom_75139`);
  row("cabecalho x (da coluna)", g.head.x - g.col.x, rm.head.dxFromCol * K);
  row("foto->cabecalho", g.head.y - g.photo.b, rm.head.dyFromPhoto * K);
  row("resumo font-size", g.exc.fs, rm.exc.fs * K);
  row("resumo line-height", parseFloat(g.exc.lh), rm.exc.lh * K);
  console.log(`resumo estilo: nosso ${g.exc.st} | RM italic`);
  row("cabecalho->resumo", g.exc.y - g.head.b, rm.exc.dyFromHeadBottom * K);
  row("pilula largura", g.pill.w, rm.pill.w * K);
  row("pilula altura", g.pill.h, rm.pill.h * K);
  row("pilula raio", parseFloat(g.pill.br), rm.pill.radius * K);
  row("pilula font-size", g.pill.fs, rm.pill.fs * K);
  row("resumo->pilula", g.pill.y - g.exc.b, rm.pill.dyFromExcBottom * K);
  row("pilula ate borda dir.", g.col.r2 - g.pill.r2, rm.pill.dxFromColRight * K);
  console.log(`pilula fundo: nosso ${g.pill.bg} | RM rgb(186, 181, 164)`);
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
