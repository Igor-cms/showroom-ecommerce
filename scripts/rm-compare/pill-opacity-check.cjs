// The pills and leader lines carry BOTH a mount animation (fade-in-up, which
// animates opacity to 1 with fill-mode `both`) and the new inline
// elementsOpacity. CSS animations outrank inline styles, so this checks which
// one actually wins on the rendered element — the fade is only real if the
// measured opacity tracks progress instead of sitting at 1.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.DEV_URL || "http://localhost:8080";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto(BASE + "/producers", { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 4000)); // let fade-in-up finish

  const read = () => page.evaluate(() => {
    // Group the pills by their producer slot (the translate3d ancestor).
    const out = [];
    for (const b of document.querySelectorAll("button")) {
      const t = b.textContent.trim().toUpperCase();
      if (!/^(MY STORY|INTERVIEW|MY COFFEES)$/.test(t)) continue;
      // The slot root is the nearest ancestor that also holds the producer's h2
      // (translate3d(0,0,0) normalises to a 2d matrix, so matching on the
      // transform missed the landed producer).
      let slot = b.parentElement;
      while (slot && !slot.querySelector("h2")) slot = slot.parentElement;
      const h2 = slot && slot.querySelector("h2");
      const name = h2 ? h2.textContent.trim() : "?";
      out.push({
        name, label: t,
        opacity: +(+getComputedStyle(b).opacity).toFixed(3),
        pe: getComputedStyle(b).pointerEvents,
      });
    }
    // One row per producer is enough.
    const seen = new Set();
    return out.filter((r) => !seen.has(r.name) && seen.add(r.name));
  });

  const tick = (n) => page.evaluate((k) => {
    const el = document.querySelector("div.relative.overflow-hidden");
    for (let i = 0; i < k; i++) el.dispatchEvent(new WheelEvent("wheel", { deltaY: 90, bubbles: true, cancelable: true }));
  }, n);

  let done = 0;
  for (const t of [0, 5, 8, 15, 23, 31]) {
    if (t > done) { await tick(t - done); done = t; await new Promise((r) => setTimeout(r, 1400)); }
    const rows = await read();
    console.log(`\n--- ${t} ticks ---`);
    rows.forEach((r) => console.log(`  ${r.name.padEnd(16)} pilula opacidade ${String(r.opacity).padEnd(6)} pointer-events ${r.pe}`));
  }
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
