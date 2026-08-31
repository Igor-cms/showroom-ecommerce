// Deep-extract the RM Producers pages (5 = Diego scene, 6 = Diana?, 7 = team):
// every image URL + rendered rect, screenshots, and the MY STORY / HOT TAKES /
// MY COFFEES overlays opened on page 5.
const fs = require("fs");
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "https://readymag.website/u2412057466/6351261/";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\rm-producers\\";

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });

  const dismissCookies = () =>
    page.evaluate(() => {
      const btn =
        document.getElementById("CybotCookiebotDialogBodyButtonDecline") ||
        [...document.querySelectorAll("button, a")].find((b) => /reject all/i.test(b.textContent || ""));
      if (btn) btn.click();
    }).catch(() => {});

  const dumpImages = () =>
    page.evaluate(() => {
      const out = [];
      for (const img of document.images) {
        const r = img.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        out.push({ src: img.currentSrc || img.src, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
      }
      // background images too
      for (const el of document.querySelectorAll("*")) {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg.startsWith("url(")) {
          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 8) continue;
          out.push({ bg: bg.slice(5, -2), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
      return out;
    });

  const results = {};
  for (const idx of [5, 6, 7]) {
    await page.goto(`${BASE}${idx}/`, { waitUntil: "networkidle2", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 2500));
    await dismissCookies();
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: `${DIR}page${idx}.png` });
    results[`page${idx}`] = await dumpImages();
  }

  // Page 5: open each overlay and capture
  await page.goto(`${BASE}5/`, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  await dismissCookies();
  for (const label of ["MY STORY", "HOT TAKES", "MY COFFEES"]) {
    const clicked = await page.evaluate((l) => {
      const els = [...document.querySelectorAll("a, button, div, span")].filter(
        (e) => (e.textContent || "").trim().toUpperCase() === l && e.getBoundingClientRect().width > 0
      );
      // pick the innermost, visible one
      const el = els[els.length - 1];
      if (!el) return false;
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      return true;
    }, label);
    await new Promise((r) => setTimeout(r, 1800));
    const slug = label.toLowerCase().replace(/\s+/g, "-");
    await page.screenshot({ path: `${DIR}p5-${slug}.png` });
    results[`p5-${slug}`] = { clicked, images: await dumpImages() };
    // close overlay (Escape or close button) before next
    await page.keyboard.press("Escape").catch(() => {});
    await page.evaluate(() => {
      const x = [...document.querySelectorAll("a, div, span, button")].find(
        (e) => (e.textContent || "").trim() === "✕" || (e.textContent || "").trim() === "×"
      );
      if (x) x.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }).catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
  }

  fs.writeFileSync(DIR + "images.json", JSON.stringify(results, null, 1));
  console.log("done — assets:", Object.keys(results).join(", "));
  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
