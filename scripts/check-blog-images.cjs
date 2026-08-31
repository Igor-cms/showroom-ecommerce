// Do the blog/podcast covers actually load? `loading="lazy"` means a fullPage
// screenshot can show the broken-image glyph even when the asset is fine, so
// check naturalWidth after scrolling each card into view.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const route = process.argv[2] || "/blog";

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true });
  const failed = [];
  p.on("requestfailed", (r) => failed.push(r.url().slice(-60)));
  p.on("response", (r) => { if (r.status() >= 400 && /\.(png|jpg|webp|avif)/i.test(r.url())) failed.push(r.status() + " " + r.url().slice(-60)); });
  await p.goto("http://localhost:8080" + route, { waitUntil: "networkidle2", timeout: 60000 });
  // walk the page so every lazy image is asked for
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 2500));
  const imgs = await p.evaluate(() =>
    [...document.querySelectorAll("article img")].map((i) => ({
      ok: i.complete && i.naturalWidth > 0,
      nat: i.naturalWidth,
      src: i.currentSrc.slice(-46),
    }))
  );
  await b.close();
  const bad = imgs.filter((i) => !i.ok);
  console.log(`${route}: ${imgs.length} covers, ${imgs.length - bad.length} loaded, ${bad.length} broken`);
  bad.forEach((i) => console.log("   BROKEN " + i.src));
  if (failed.length) console.log("failed requests:", [...new Set(failed)].slice(0, 6));
})().catch((e) => { console.error(e.message); process.exit(1); });
