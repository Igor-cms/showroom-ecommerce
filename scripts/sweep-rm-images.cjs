// Sweep every page of the RM mockup project (6396534) and collect unique
// image asset URLs (looking for the menu slideshow photos).
const fs = require("fs");
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "https://readymag.website/u2412057466/6396534/";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  const seen = new Map();
  for (let i = 1; i <= 10; i++) {
    const url = i === 1 ? BASE : `${BASE}${i}/`;
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.evaluate(() => {
        const btn = document.getElementById("CybotCookiebotDialogBodyButtonDecline");
        if (btn) btn.click();
      }).catch(() => {});
      // scroll through the page to force lazy images
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 800) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await new Promise((r) => setTimeout(r, 800));
      const imgs = await page.evaluate(() => {
        const out = [];
        for (const img of document.images) out.push({ src: img.currentSrc || img.src, w: img.naturalWidth, h: img.naturalHeight });
        for (const el of document.querySelectorAll("*")) {
          const bg = getComputedStyle(el).backgroundImage;
          if (bg && bg.startsWith("url(") && !bg.includes("data:")) out.push({ src: bg.slice(5, -2), w: 0, h: 0 });
        }
        return out;
      });
      for (const im of imgs) {
        const m = im.src.match(/image-([0-9a-f-]+)\.(png|jpe?g|webp)/i);
        if (m && !seen.has(m[1])) seen.set(m[1], { page: i, src: im.src.split("?")[0], w: im.w, h: im.h });
      }
      console.log(`page ${i}: total unique so far ${seen.size}`);
    } catch (e) {
      console.log(`page ${i} ERR ${e.message.slice(0, 60)}`);
    }
  }
  fs.writeFileSync("scripts/rm-menu/all-images.json", JSON.stringify([...seen.entries()], null, 1));
  console.log("saved", seen.size, "unique assets");
  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
