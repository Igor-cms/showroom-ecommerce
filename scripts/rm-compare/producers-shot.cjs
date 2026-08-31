// Screenshot the Producers scene after N wheel ticks (0 = Diego, ~15 = Diana,
// ~31 = Allan at 1600 wide; the tick count scales with viewport width).
// Usage: node producers-shot.cjs <ticks> <out.png> [w] [h]
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.DEV_URL || "http://localhost:8080";
const TICKS = parseInt(process.argv[2] || "0", 10);
const OUT = process.argv[3] || "producers.png";
const W = parseInt(process.argv[4] || "1600", 10);
const H = parseInt(process.argv[5] || "900", 10);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(BASE + "/producers", { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3800));
  if (TICKS) {
    await page.evaluate((n) => {
      const el = document.querySelector("div.relative.overflow-hidden");
      for (let i = 0; i < n; i++) {
        el.dispatchEvent(new WheelEvent("wheel", { deltaY: 90, bubbles: true, cancelable: true }));
      }
    }, TICKS);
    await new Promise((r) => setTimeout(r, 2200));
  }
  // Optional 6th arg: open a producer's island before shooting (pill label).
  const PILL = process.argv[6];
  if (PILL) {
    await page.evaluate((label) => {
      const b = [...document.querySelectorAll("button")].find((el) => {
        if (!el.textContent.trim().toUpperCase().startsWith(label)) return false;
        // Only the visible producer's pills are hit-testable now.
        return getComputedStyle(el).pointerEvents !== "none";
      });
      if (b) b.click();
    }, PILL.toUpperCase());
    await new Promise((r) => setTimeout(r, 1600));
  }
  await page.screenshot({ path: OUT });
  console.log("ok " + OUT);
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
