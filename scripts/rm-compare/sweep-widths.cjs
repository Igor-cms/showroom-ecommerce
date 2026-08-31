// Shoot /blog and /podcast at a range of widths, into a named folder.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fs = require("fs");
const tag = process.argv[2] || "x";
const W = [320, 375, 500, 639, 640, 700, 767, 768, 900, 1200, 1440];
(async () => {
  fs.mkdirSync(tag, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  for (const route of ["/blog", "/podcast"]) {
    for (const w of W) {
      await page.setViewport({ width: w, height: 700, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
      await page.goto("http://localhost:8080" + route, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: `${tag}/${route.slice(1)}-${w}.png` });
    }
  }
  await browser.close();
  console.log("ok " + tag);
})().catch((e) => { console.error(e.message); process.exit(1); });
