// One-off helper: open the site menu in real Chrome and screenshot it so we can
// visually verify the menu overlay (incl. inputs, which the DOM-text script can't see).
const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:8080/";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
  await page.click('[aria-label="Open menu"]');
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: DIR + "menu-shot.png" });

  // Tight crop around the SEARCH input.
  const searchRect = await page.evaluate(() => {
    const i = document.querySelector('input[placeholder="SEARCH"]');
    if (!i) return null;
    const r = i.parentElement.getBoundingClientRect();
    return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: r.height + 16 };
  });
  if (searchRect) await page.screenshot({ path: DIR + "search-shot.png", clip: searchRect });

  // Tight crop around the WHOLESALE PORTAL block (title + email + password + login).
  const portalRect = await page.evaluate(() => {
    const p = [...document.querySelectorAll("p")].find((el) =>
      /wholesale portal/i.test(el.textContent)
    );
    if (!p) return null;
    const block = p.parentElement;
    const r = block.getBoundingClientRect();
    return { x: r.x - 8, y: r.y - 4, width: r.width + 16, height: r.height + 12 };
  });
  if (portalRect) await page.screenshot({ path: DIR + "portal-shot.png", clip: portalRect });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
