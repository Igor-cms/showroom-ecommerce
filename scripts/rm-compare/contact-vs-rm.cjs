// /contact desktop vs the RM canvas (1024 x 698) scaled to 1440.
// Scoped to visible elements inside the page's own content — the menu overlay
// lives in the DOM with matching text and was being picked up instead.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const VW = parseInt(process.argv[2] || "1440", 10);
const K = VW / 1024;
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: parseInt(process.argv[3] || "900", 10), deviceScaleFactor: 1 });
  await page.goto((process.env.DEV_URL || "http://localhost:8080") + "/contact", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  const g = await page.evaluate(() => {
    const vis = (e) => {
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      for (let n = e; n && n !== document.body; n = n.parentElement) {
        const c = getComputedStyle(n);
        if (c.display === "none" || c.visibility === "hidden" || +c.opacity < 0.05) return false;
      }
      return true;
    };
    const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: +r.left.toFixed(1), y: +(r.top + scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
    const root = document.body;
    const all = [...root.querySelectorAll("*")].filter(vis);
    const byText = (re) => all.find((e) => e.children.length === 0 && re.test((e.textContent || "").trim()));
    const fields = [...root.querySelectorAll("input,textarea,select")].filter(vis)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const h = document.querySelector("header");
    const title = byText(/^contact$/i);
    const F = (e) => { if (!e) return null; const c = getComputedStyle(e); return { fs: +parseFloat(c.fontSize).toFixed(2), ls: c.letterSpacing }; };
    return {
      headerBottom: h ? h.getBoundingClientRect().bottom : 0,
      wholesale: R(byText(/WHOLESALE INQUIRIES/i)),
      title: title ? { ...R(title), ...F(title) } : null,
      fields: fields.map((e) => ({ tag: e.tagName, ph: (e.placeholder || "").slice(0, 14), ...R(e) })),
      submit: R(byText(/^submit$/i)),
      native: R(byText(/^native$/i)),
      docH: document.documentElement.scrollHeight, vh: innerHeight,
    };
  });
  const rm = { rule: 39.5, wh: 211, title: 241.9, titleX: 502, titleFs: 60, name: 312.8, pitch: 17, msg: 364.6, msgH: 192, submit: 566.5, native: 606.4, page: 698, fieldW: 507 };
  const P = (l, ours, rmv) => {
    if (ours == null) { console.log(`${l.padEnd(28)} (nao encontrado)`); return; }
    const d = ours - rmv;
    console.log(`${l.padEnd(28)} nosso ${String(ours.toFixed(1)).padStart(8)}   RM ${String(rmv.toFixed(1)).padStart(8)}   d ${(d >= 0 ? "+" : "") + d.toFixed(1)}${Math.abs(d) > 2 ? "   <<<" : ""}`);
  };
  const b = g.headerBottom;
  console.log(`--- a partir da base do header (viewport ${VW}) ---`);
  P("botao wholesale y", g.wholesale && g.wholesale.y - b, (rm.wh - rm.rule) * K);
  P("CONTACT y", g.title && g.title.y - b, (rm.title - rm.rule) * K);
  P("CONTACT x", g.title && g.title.x, rm.titleX * K);
  P("CONTACT font-size", g.title && g.title.fs, rm.titleFs * K);
  console.log("campos (em ordem vertical):");
  g.fields.forEach((f, i) => console.log(`   ${i} ${f.tag}[${f.ph}] y ${(f.y - b).toFixed(1)}  x ${f.x}  w ${f.w}  h ${f.h}`));
  if (g.fields[0]) { P("1o campo y", g.fields[0].y - b, (rm.name - rm.rule) * K); P("largura do campo", g.fields[0].w, rm.fieldW * K); }
  if (g.fields[1]) P("pitch entre campos", g.fields[1].y - g.fields[0].y, rm.pitch * K);
  const ta = g.fields.find((f) => f.tag === "TEXTAREA");
  if (ta) { P("textarea y", ta.y - b, (rm.msg - rm.rule) * K); P("textarea altura", ta.h, rm.msgH * K); }
  P("SUBMIT y", g.submit && g.submit.y - b, (rm.submit - rm.rule) * K);
  P("NATIVE y", g.native && g.native.y - b, (rm.native - rm.rule) * K);
  P("altura da pagina", g.docH, rm.page * K);
  console.log(`viewport ${g.vh}px — no RM a pagina inteira cabe em ${(rm.page * K).toFixed(0)}`);
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
