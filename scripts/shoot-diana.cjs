// Capture Diana (progress 1) at 1600×900 to compare her framing against Allan.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  // wheels to reach progress 1 (Diana settled).
  for (let i = 0; i < 15; i++) {
    await page.mouse.move(800, 450);
    await page.mouse.wheel({ deltaY: 90 });
    await new Promise((r) => setTimeout(r, 40));
  }
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: DIR + "producers-diana.png" });
  await browser.close();
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
