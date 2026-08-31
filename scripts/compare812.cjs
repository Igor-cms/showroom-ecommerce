// Render RM page-5 and our /producers at the TARGET size (812x431) and measure the
// visible producer name + the chip connector lines, so we can match the target.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
const W = 812, H = 431;
const which = process.argv[2] || "both";

async function shoot(url, out, isRM) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, isRM ? 4000 : 1500));
  await page.screenshot({ path: DIR + out });
  const m = await page.evaluate(() => {
    const visible = (el) => { const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return r.width > 1 && cs.visibility !== "hidden" && +cs.opacity > 0.05 && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth; };
    const nameEl = [...document.querySelectorAll("*")].find((e) => !e.children.length
      && /DIEGO BERMUDEZ/i.test((e.textContent || "").trim()) && !/window\.RM|var RM/.test(e.textContent) && visible(e));
    const name = nameEl ? (() => { const r = nameEl.getBoundingClientRect();
      return { xPct: +(100 * (r.x + r.width / 2) / innerWidth).toFixed(1), yPct: +(100 * r.y / innerHeight).toFixed(1),
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), fs: getComputedStyle(nameEl).fontSize }; })() : null;
    // chip-ish small pill labels
    const chips = [...document.querySelectorAll("*")].filter((e) => !e.children.length
      && /^(MY STORY|INTERVIEW|HOT TAKES|MY COFFEES)$/i.test((e.textContent || "").trim()) && visible(e))
      .map((e) => { const r = e.getBoundingClientRect();
        return { t: e.textContent.trim(), xPct: +(100 * (r.x + r.width / 2) / innerWidth).toFixed(1), yPct: +(100 * (r.y + r.height / 2) / innerHeight).toFixed(1) }; });
    return { name, chips, vw: innerWidth, vh: innerHeight };
  });
  console.log(out, JSON.stringify(m));
  await browser.close();
}
(async () => {
  if (which === "rm" || which === "both") await shoot("http://localhost:8092/5/", "t-rm.png", true);
  if (which === "ours" || which === "both") await shoot("http://localhost:8080/producers", "t-ours.png", false);
})().catch((e) => { console.error(e); process.exit(1); });
