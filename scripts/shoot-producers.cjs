const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 820, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: DIR + "producers-shot.png" });
  await browser.close();
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
