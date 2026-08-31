// Does /contact overflow the window, and by how much, across common screens?
// Also dumps the vertical stack (header / grid / footer) so we can see WHICH
// block drives the height.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.DEV_URL || "http://localhost:8080";
const SIZES = [[1280, 800], [1280, 720], [1366, 768], [1440, 900], [1440, 780],
                [1600, 900], [1920, 1080], [1920, 940]];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(BASE + "/contact", { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1800));
    const m = await page.evaluate(() => {
      const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { y: +(r.top + scrollY).toFixed(1), b: +(r.bottom + scrollY).toFixed(1), h: +r.height.toFixed(1) }; };
      const header = document.querySelector("header");
      const main = document.querySelector("main");
      const form = document.querySelector("form");
      const ta = document.querySelector("textarea");
      const btn = document.querySelector('button[type="submit"]');
      // The footer bar is the last direct child of the page root.
      const root = main && main.parentElement;
      const footer = root && root.lastElementChild !== main ? root.lastElementChild : null;
      return {
        doc: document.documentElement.scrollHeight, vh: innerHeight,
        rootH: root ? +root.getBoundingClientRect().height.toFixed(1) : null,
        header: R(header), main: R(main), form: R(form),
        ta: R(ta), btn: R(btn), footer: R(footer),
      };
    });
    const K = w / 1024;
    const over = m.doc - m.vh;
    console.log(`\n=== ${w}x${h}  K=${K.toFixed(4)} ===`);
    console.log(`  doc ${m.doc}  vh ${m.vh}  -> ${over > 2 ? `ROLA ${over}px` : "cabe"}   raiz ${m.rootH}`);
    const L = (n, o) => o && console.log(`  ${n.padEnd(9)} y ${String(o.y).padStart(7)}  ate ${String(o.b).padStart(7)}  alt ${o.h}`);
    L("header", m.header); L("main", m.main); L("form", m.form);
    L("textarea", m.ta); L("submit", m.btn); L("rodape", m.footer);
    if (m.ta) console.log(`  textarea em canvas-px: ${(m.ta.h / K).toFixed(1)} (RM 192)`);
  }
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
