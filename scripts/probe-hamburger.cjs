// Capture tight crops of the mobile hamburger across viewport widths AND device
// pixel ratios, plus its geometry, so probe-hamburger.py can measure whether the
// two bars rasterise identically and whether the icon keeps RM's proportions.
// Writes scripts/ham-probe/<width>x<dpr>.png + geometry.json.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.join(__dirname, "ham-probe");
const WIDTHS = [320, 375, 393, 430, 600, 760];
const DPRS = [1, 1.25, 1.5, 2, 3];

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new", args: ["--no-sandbox"],
  });
  const geom = {};
  for (const width of WIDTHS) {
    for (const dsf of DPRS) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: 260, deviceScaleFactor: dsf, isMobile: true });
      await page.goto("http://localhost:8080/contact", { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 800));
      const box = await page.evaluate(() => {
        const btn = document.querySelector('button[aria-label="Open menu"]');
        if (!btn) return null;
        const g = btn.querySelector("svg") || btn.firstElementChild || btn;
        const r = g.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      if (!box) { console.error(`width=${width} dpr=${dsf}: NO HAMBURGER`); await page.close(); continue; }
      await page.screenshot({
        path: path.join(OUT, `${width}x${dsf}.png`),
        clip: { x: Math.max(0, box.x - 4), y: Math.max(0, box.y - 4), width: box.w + 8, height: box.h + 8 },
      });
      geom[`${width}x${dsf}`] = { w: +box.w.toFixed(2), h: +box.h.toFixed(2), dpr: dsf, vw: width };
      await page.close();
    }
  }
  fs.writeFileSync(path.join(OUT, "geometry.json"), JSON.stringify(geom, null, 1));
  await browser.close();
  console.log("captured -> " + OUT);
})().catch((e) => { console.error(e.message); process.exit(1); });
