// Capture /contact at several widths into <prefix>-<w>.png, for before/after
// pixel diffing. Usage: node shot-widths.cjs <rota> <prefixo> <w:h,w:h,...>
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.DEV_URL || "http://localhost:8080";
const route = process.argv[2] || "/contact";
const prefix = process.argv[3] || "shot";
const sizes = (process.argv[4] || "320:640,375:780,767:900").split(",")
  .map((s) => s.split(":").map(Number));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message.slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
  for (const [w, h] of sizes) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
    await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2200));
    // Height is part of the name too — /contact now scales with it, so two
    // captures at the same width but different heights are NOT the same shot.
    const out = sizes.filter((s) => s[0] === w).length > 1
      ? `${prefix}-${w}x${h}.png` : `${prefix}-${w}.png`;
    await page.screenshot({ path: out, fullPage: true });
    console.log("ok " + out);
  }
  console.log(errs.length ? "CONSOLE: " + [...new Set(errs)].join(" | ") : "console limpo");
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
