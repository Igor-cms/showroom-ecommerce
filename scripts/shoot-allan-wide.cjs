// Verify Allan holds at a WIDE/SHORT viewport (like the user's ~1900px browser
// at 125% zoom, where cover-scaling magnifies the stage ~1.2x). If the lines
// connect here, they connect everywhere.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1900, height: 780, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  for (let i = 0; i < 60; i++) {
    await page.mouse.move(950, 400);
    await page.mouse.wheel({ deltaY: 90 });
    await new Promise((r) => setTimeout(r, 40));
  }
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: DIR + "producers-allan-wide.png" });
  await browser.close();
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
