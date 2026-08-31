// Viewport-only screenshot at a scroll offset. Usage:
//   node shot.cjs <route> <out> [w] [h] [scrollY]
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const route = process.argv[2] || "/shop";
const out = process.argv[3] || "ours.png";
const W = parseInt(process.argv[4] || "320", 10);
const H = parseInt(process.argv[5] || "580", 10);
const SY = parseInt(process.argv[6] || "0", 10);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto((process.env.DEV_URL || "http://localhost:8080") + route, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  if (SY) { await page.evaluate((y) => window.scrollTo(0, y), SY); await new Promise((r) => setTimeout(r, 900)); }
  await page.screenshot({ path: out });
  await browser.close();
  console.log("done " + out);
})().catch((e) => { console.error(e.message); process.exit(1); });
