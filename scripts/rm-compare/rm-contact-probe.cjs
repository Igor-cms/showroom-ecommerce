// Where do the real widgets land on the LIVE Readymag contact page as the
// window changes shape? Tells us whether RM scales by width (and scrolls /
// clips) or fits the composition to the viewport.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "https://readymag.website/u2412057466/6396534/6/";
const SIZES = [[1280, 800], [1440, 900], [1440, 1200], [1600, 900], [1920, 1080], [1920, 700]];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(URL, { waitUntil: "networkidle2", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 3500));
    const m = await page.evaluate(() => {
      const vis = (e) => {
        const r = e.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        for (let n = e; n && n !== document.body; n = n.parentElement) {
          const c = getComputedStyle(n);
          if (c.display === "none" || c.visibility === "hidden" || +c.opacity < 0.05) return false;
        }
        return true;
      };
      const R = (e) => { const r = e.getBoundingClientRect(); return { x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
      const all = [...document.querySelectorAll("body *")].filter(vis);
      const leaf = (re) => all.find((e) => e.children.length === 0 && re.test((e.textContent || "").trim()));
      const title = leaf(/^contact$/i);
      const submit = leaf(/^submit$/i);
      const native = leaf(/^native$/i);
      const pill = leaf(/WHOLESALE INQUIRIES/i);
      // Bottom-most visible widget inside the page stage.
      const stage = document.querySelector(".pages-container") || document.body;
      let bottom = 0, bottomEl = null;
      for (const e of all) {
        if (!stage.contains(e)) continue;
        const r = e.getBoundingClientRect();
        if (r.bottom > bottom && r.width < innerWidth * 1.01) { bottom = r.bottom; bottomEl = e.tagName + "." + String(e.className).slice(0, 30); }
      }
      const pc = document.querySelector(".pages-container");
      return {
        title: title && { ...R(title), fs: getComputedStyle(title).fontSize },
        pill: pill && R(pill),
        submit: submit && R(submit),
        native: native && R(native),
        bottom: +bottom.toFixed(1), bottomEl,
        pages: pc && { ...R(pc), scrollH: pc.scrollHeight, clientH: pc.clientHeight },
        innerH: innerHeight,
      };
    });
    const K = w / 1024;
    const f = (o) => (o ? `y ${String(o.y).padStart(7)}  x ${String(o.x).padStart(6)}  ${o.w}x${o.h}` : "-");
    console.log(`\n=== ${w}x${h}   K=${K.toFixed(4)}   canvas 698 -> ${(698 * K).toFixed(0)}px ===`);
    console.log(`  pill    ${f(m.pill)}`);
    console.log(`  CONTACT ${f(m.title)}  ${m.title ? m.title.fs : ""}`);
    console.log(`  SUBMIT  ${f(m.submit)}`);
    console.log(`  NATIVE  ${f(m.native)}`);
    console.log(`  fundo do conteudo ${m.bottom}  (${m.bottomEl})   innerH ${m.innerH}` +
      `  -> ${m.bottom > m.innerH + 2 ? "PASSA DA TELA" : "cabe"}`);
    if (m.pages) console.log(`  .pages-container ${m.pages.w}x${m.pages.h} scrollH ${m.pages.scrollH} clientH ${m.pages.clientH}`);
  }
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
