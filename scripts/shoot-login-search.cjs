// Temp helper: screenshot the redesigned /login page and the menu search
// dropdown (types "golden" and waits for Shopify results).
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
  await page.setViewport({ width: 1534, height: 776, deviceScaleFactor: 1 });

  await page.goto("http://localhost:8080/login", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: OUT + "login-page.png" });

  await page.goto("http://localhost:8080/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.click('[aria-label="Open menu"]');
  await new Promise((r) => setTimeout(r, 600));
  await page.type('input[placeholder="SEARCH"]', "golden", { delay: 40 });
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: OUT + "search-dropdown.png" });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
