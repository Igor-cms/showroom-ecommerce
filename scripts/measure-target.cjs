// Measure the target Producers page at a FIXED 1600x900 viewport. Reports absolute
// pixel coordinates for the portrait, name block, hotspots and connector lines.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
const URL = "http://localhost:8092/5/";

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: DIR + "target-1600.png" });

  const data = await page.evaluate(() => {
    const vis = (el) => { const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1 && cs.visibility !== "hidden" && +cs.opacity > 0.05 && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; };
    const box = (el) => { const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) }; };

    // Portrait: visible <img> that is tall & in the right half (the producer cutout)
    const portraits = [...document.querySelectorAll("img")].filter((im) => vis(im) && im.getBoundingClientRect().height > 250)
      .map((im) => ({ ...box(im), src: (im.currentSrc || im.src).split("/").pop().slice(0, 24) }))
      .sort((a, b) => (b.w * b.h) - (a.w * a.h));

    // Name + subtitle
    const nameEl = [...document.querySelectorAll("*")].find((e) => !e.children.length
      && /^DIEGO BERMUDEZ$/i.test((e.textContent || "").trim()) && vis(e) && !/window\.RM|var RM/.test(e.textContent));
    const subEl = [...document.querySelectorAll("*")].find((e) => !e.children.length
      && /CO-?FOUNDER/i.test((e.textContent || "").trim()) && vis(e));

    // Hotspots
    const hotspots = [...document.querySelectorAll("*")].filter((e) => !e.children.length
      && /^(MY STORY|INTERVIEW|HOT TAKES|MY COFFEES)$/i.test((e.textContent || "").trim()) && vis(e))
      .map((e) => ({ label: e.textContent.trim(), ...box(e) }));

    // Connector lines (svg with a path)
    const lines = [...document.querySelectorAll("svg")].filter((s) => vis(s) && s.getBoundingClientRect().width < 200)
      .map((s) => ({ ...box(s), html: s.innerHTML.slice(0, 90) }))
      .filter((l) => l.cx > 400);

    return {
      viewport: { w: innerWidth, h: innerHeight },
      portrait: portraits.slice(0, 4),
      name: nameEl ? { ...box(nameEl), fs: getComputedStyle(nameEl).fontSize, color: getComputedStyle(nameEl).color } : null,
      subtitle: subEl ? box(subEl) : null,
      hotspots,
      lines: lines.slice(0, 8),
    };
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
