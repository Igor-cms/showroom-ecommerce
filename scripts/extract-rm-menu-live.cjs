// Open the RM mockup project's menu overlay (hamburger) and extract it:
// screenshot + all texts with computed styles + all images, at 1600×900.
const fs = require("fs");
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "https://readymag.website/u2412057466/6396534/";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\rm-menu\\";

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3000));
  await page.evaluate(() => {
    const btn =
      document.getElementById("CybotCookiebotDialogBodyButtonDecline") ||
      [...document.querySelectorAll("button, a")].find((b) => /reject all/i.test(b.textContent || ""));
    if (btn) btn.click();
  }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));

  // Find the burger widget: RM renders it near the top-right corner.
  const burger = await page.evaluate(() => {
    const cands = [...document.querySelectorAll("*")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 10 && r.width < 90 && r.height > 6 && r.height < 60 &&
        r.x > 1400 && r.y < 90 && (el.className + " " + el.id).toString().match(/burger|menu|hamb/i);
    });
    if (!cands.length) return null;
    const r = cands[0].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, cls: String(cands[0].className).slice(0, 60) };
  });
  console.log("burger:", JSON.stringify(burger));
  const target = burger || { x: 1564, y: 30 }; // fallback: mockup burger position
  await page.mouse.click(target.x, target.y);
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: DIR + "menu-open.png" });

  const dump = await page.evaluate(() => {
    const texts = [];
    const walk = (el) => {
      for (const child of el.children) walk(child);
      const direct = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent).join("").trim();
      if (!direct) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") return;
      texts.push({
        t: direct.slice(0, 60),
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        fs: cs.fontSize, lh: cs.lineHeight, ls: cs.letterSpacing, fw: cs.fontWeight,
        ff: cs.fontFamily.split(",")[0].replace(/"/g, "").slice(0, 20),
        col: cs.color, bg: cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : undefined,
      });
    };
    walk(document.body);
    const imgs = [];
    for (const img of document.images) {
      const r = img.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      imgs.push({ src: (img.currentSrc || img.src).slice(0, 120), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
    }
    return { texts, imgs };
  });
  fs.writeFileSync(DIR + "menu-dump.json", JSON.stringify(dump, null, 1));
  console.log("texts:", dump.texts.length, "imgs:", dump.imgs.length);
  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
