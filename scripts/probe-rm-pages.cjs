// Enumerate the RM project's pages (viewer URLs are /<index>/) and print a
// text snippet of each so we can find the Producers page.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "https://readymag.website/u2412057466/6351261/";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });

  const dismissCookies = async () => {
    try {
      await page.evaluate(() => {
        const btn =
          document.getElementById("CybotCookiebotDialogBodyButtonDecline") ||
          [...document.querySelectorAll("button, a")].find((b) => /reject all/i.test(b.textContent || ""));
        if (btn) btn.click();
      });
    } catch (e) { /* no banner */ }
  };

  for (let i = 1; i <= 12; i++) {
    const url = i === 1 ? BASE : `${BASE}${i}/`;
    try {
      const resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1500));
      await dismissCookies();
      const snap = await page.evaluate(() => {
        const t = document.body.innerText.replace(/\s+/g, " ").trim();
        // strip the cookie banner text if present
        return t.replace(/We use cookies.*?Reject all/i, "").slice(0, 220);
      });
      console.log(`--- page ${i} [${resp ? resp.status() : "?"}] ${page.url()}`);
      console.log("   ", snap);
    } catch (e) {
      console.log(`--- page ${i} ERROR: ${e.message.slice(0, 80)}`);
    }
  }
  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
