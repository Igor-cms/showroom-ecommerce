// Reveal ONLY the first RM menu overlay copy (the export embeds one per page),
// screenshot it cleanly + crop portal/search, and extract pills from that copy.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
const BASE = "http://localhost:8091/index.html";

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500));

  await page.evaluate(() => {
    const layers = [...document.querySelectorAll(".above-pages-container")];
    layers.forEach((c, i) => {
      if (i === 0) {
        c.style.opacity = "1"; c.style.visibility = "visible"; c.style.zIndex = "99999";
        c.querySelectorAll("*").forEach((e) => { e.style.opacity = "1"; e.style.visibility = "visible"; });
      } else { c.style.display = "none"; }
    });
    // also hide the page content behind so crops are clean
    document.querySelectorAll(".mag-pages-container > *").forEach((e) => {
      if (!e.classList.contains("above-pages-container")) e.style.opacity = "0.0";
    });
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: DIR + "rm-correct-menu.png" });

  const data = await page.evaluate(() => {
    const root = document.querySelectorAll(".above-pages-container")[0] || document.body;
    const all = [...root.querySelectorAll("*")];
    const texts = all.filter((e) => !e.children.length && (e.textContent || "").trim())
      .map((e) => ({ t: (e.textContent || "").trim(), r: e.getBoundingClientRect() }));
    const near = (x, y) => { let b = "", bd = 70; for (const o of texts) {
      const d = Math.hypot(o.r.left - x, o.r.top + o.r.height / 2 - y); if (d < bd) { bd = d; b = o.t; } } return b.slice(0, 16); };
    const pills = all.map((el) => ({ cs: getComputedStyle(el), r: el.getBoundingClientRect() }))
      .filter(({ cs, r }) => {
        const rad = parseFloat(cs.borderTopLeftRadius) || 0;
        return (rad >= 6 || cs.borderTopLeftRadius.includes("%")) && r.height >= 10 && r.height <= 46 && r.width >= 50 && r.width <= 480;
      })
      .map(({ cs, r }) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        radius: cs.borderTopLeftRadius, bW: cs.borderTopWidth, bColor: cs.borderTopColor, bStyle: cs.borderTopStyle,
        bg: cs.backgroundColor, near: near(r.x + 10, r.y + r.height / 2) }))
      .sort((a, b) => a.y - b.y);

    // locate the WHOLESALE PORTAL text to crop around it
    const wp = texts.find((o) => /WHOLESALE PORTAL/i.test(o.t));
    const portalRect = wp ? { x: Math.max(0, wp.r.x - 12), y: Math.max(0, wp.r.y - 8), w: 320, h: 130 } : null;
    return { pills, portalRect };
  });

  console.log(JSON.stringify(data.pills, null, 1));
  try {
    if (data.portalRect) {
      const c = data.portalRect;
      await page.screenshot({ path: DIR + "rm-portal-crop.png",
        clip: { x: Math.round(c.x), y: Math.round(c.y), width: Math.round(c.w), height: Math.round(c.h) } });
    }
  } catch (e) { console.log("crop skipped: " + e.message); }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
