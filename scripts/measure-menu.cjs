// Reveal the first RM menu copy and dump EXACT geometry of every text element and
// every pill/shape, so we can copy positions/sizes pixel-perfect.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
const BASE = "http://localhost:8091/index.html";

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500));

  await page.evaluate(() => {
    const layers = [...document.querySelectorAll(".above-pages-container")];
    layers.forEach((c, i) => {
      if (i === 0) {
        c.style.opacity = "1"; c.style.visibility = "visible"; c.style.zIndex = "99999";
        c.querySelectorAll("*").forEach((e) => { e.style.opacity = "1"; e.style.visibility = "visible"; });
      } else c.style.display = "none";
    });
    document.querySelectorAll(".mag-pages-container > *").forEach((e) => {
      if (!e.classList.contains("above-pages-container")) e.style.opacity = "0";
    });
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: DIR + "rm-measure.png" });

  const out = await page.evaluate(() => {
    const root = document.querySelectorAll(".above-pages-container")[0];
    const inside = (r) => r.width > 0 && r.height > 0 && r.top > -50 && r.top < 1100 && r.left > -50;
    const texts = [];
    root.querySelectorAll("*").forEach((e) => {
      if (e.children.length) return;
      const t = (e.textContent || "").trim();
      if (!t) return;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (!inside(r)) return;
      texts.push({ t: t.slice(0, 22), x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize, fw: cs.fontWeight });
    });
    // Shapes: rounded or bordered boxes (incl. svg) in the right region.
    const shapes = [];
    root.querySelectorAll("div,a,button,svg,rect,span").forEach((e) => {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (!inside(r) || r.height > 50 || r.width < 40 || r.width > 480) return;
      const rad = parseFloat(cs.borderTopLeftRadius) || 0;
      const bordered = cs.borderTopStyle !== "none" && parseFloat(cs.borderTopWidth) > 0;
      const filled = cs.backgroundColor !== "rgba(0, 0, 0, 0)";
      const svg = e.tagName.toLowerCase() === "rect" || e.tagName.toLowerCase() === "svg";
      if (rad < 4 && !bordered && !filled && !svg) return;
      shapes.push({ tag: e.tagName.toLowerCase(), x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height), rad: cs.borderTopLeftRadius,
        bW: cs.borderTopWidth, bC: cs.borderTopColor, bg: cs.backgroundColor });
    });
    return { texts: texts.sort((a, b) => a.y - b.y || a.x - b.x), shapes: shapes.sort((a, b) => a.y - b.y || a.x - b.x) };
  });
  console.log(JSON.stringify(out));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
