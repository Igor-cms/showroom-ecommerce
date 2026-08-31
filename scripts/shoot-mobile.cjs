// Screenshot any route at mobile size. Usage:
//   node scripts/shoot-mobile.cjs <route> <outName> [width] [height]
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";

const route = process.argv[2] || "/contact";
const out = process.argv[3] || "mobile.png";
const W = parseInt(process.argv[4] || "375", 10);
const H = parseInt(process.argv[5] || "812", 10);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:8080" + route, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({ path: DIR + out, fullPage: true });
  await browser.close();
  console.log("done " + out);
})().catch((e) => { console.error(e.message); process.exit(1); });
