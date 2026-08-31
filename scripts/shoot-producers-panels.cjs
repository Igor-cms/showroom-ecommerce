// Temp helper: screenshot the Producers scene plus the MY STORY and
// MY COFFEES islands after the client-feedback round.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 820, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  await page.screenshot({ path: DIR + "producers-shot.png" });

  const clickPill = async (label) => {
    await page.evaluate((l) => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.trim().toUpperCase().includes(l)
      );
      if (btn) btn.click();
    }, label);
    await new Promise((r) => setTimeout(r, 1200));
  };

  await clickPill("MY STORY");
  await page.screenshot({ path: DIR + "producers-story.png" });
  await clickPill("INTERVIEW");
  await page.screenshot({ path: DIR + "producers-interview.png" });
  await clickPill("MY COFFEES");
  await new Promise((r) => setTimeout(r, 2000)); // let Shopify products load
  await page.screenshot({ path: DIR + "producers-coffees.png" });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
