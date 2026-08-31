const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:8091/index.html";
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500));
  const out = await page.evaluate(() => {
    const targets = ["WHOLESALE PORTAL", "EMAIL", "PASSWORD", "SEARCH", "CREATE ACCOUNT"];
    const res = {};
    for (const txt of targets) {
      const el = [...document.querySelectorAll("*")].find(
        (e) => (e.textContent || "").trim() === txt && !e.children.length);
      if (!el) { res[txt] = "NOT FOUND"; continue; }
      const chain = [];
      let n = el, d = 0;
      while (n && d < 8) {
        const cs = getComputedStyle(n), r = n.getBoundingClientRect();
        chain.push({ tag: n.tagName.toLowerCase(), cls: (n.className?.toString?.() || "").slice(0, 24),
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          display: cs.display, opacity: cs.opacity, visibility: cs.visibility,
          radius: cs.borderTopLeftRadius, bW: cs.borderTopWidth, bColor: cs.borderTopColor, bg: cs.backgroundColor });
        n = n.parentElement; d++;
      }
      res[txt] = chain;
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
