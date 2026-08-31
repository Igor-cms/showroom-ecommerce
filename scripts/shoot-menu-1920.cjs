// Temp helper: screenshot the menu overlay at a 1920x1015 viewport (matches
// the client's mockup proportions) for pixel comparison.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1015, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.click('[aria-label="Open menu"]');
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: OUT + "menu-1920.png" });
  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
