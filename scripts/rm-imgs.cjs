const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await p.goto("http://localhost:8092/5/", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  const imgs = await p.evaluate(() => [...document.querySelectorAll("img")].map((im) => {
    const r = im.getBoundingClientRect(); const cs = getComputedStyle(im);
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      cx: Math.round(r.x + r.width / 2), vis: cs.visibility, op: +cs.opacity, src: (im.currentSrc || im.src).split("/").pop().slice(0, 18) };
  }).filter((o) => o.w > 80 && o.h > 150 && o.x < 1600 && o.x + o.w > 0 && o.vis !== "hidden" && o.op > 0.1));
  console.log(JSON.stringify(imgs, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
