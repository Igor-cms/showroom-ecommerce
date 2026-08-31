// Inspect the RM producers (page 5) layout: name, the producer portrait <img>,
// and any arrow/line element near the name. Also save a clean screenshot + a crop
// around the name so we can SEE the name-beside-face + arrow.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 820, deviceScaleFactor: 2 });
  await page.goto("http://localhost:8092/5/", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: DIR + "rm-producers-page.png" });

  const data = await page.evaluate(() => {
    const inView = (r) => r.width > 1 && r.height > 1 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
    const visible = (el) => { const cs = getComputedStyle(el); return cs.visibility !== "hidden" && +cs.opacity > 0.05 && cs.display !== "none"; };

    // Name
    const nameEl = [...document.querySelectorAll("*")].find((e) => !e.children.length
      && /^DIEGO BERMUDEZ$/i.test((e.textContent || "").trim()) && visible(e) && inView(e.getBoundingClientRect()));
    const name = nameEl ? (() => { const r = nameEl.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null;

    // Portrait: biggest visible <img> that's tall (the person cutout)
    const imgs = [...document.querySelectorAll("img")].map((im) => ({ im, r: im.getBoundingClientRect(), src: im.currentSrc || im.src }))
      .filter(({ im, r }) => visible(im) && inView(r) && r.height > 200)
      .sort((a, b) => b.r.height * b.r.width - a.r.height * a.r.width)
      .map(({ r, src }) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), src: src.split("/").pop() }));

    // Arrow/line candidates near the name: thin elements or svg around the name area
    const lines = [];
    if (name) {
      [...document.querySelectorAll("div,span,svg,line,path,img")].forEach((e) => {
        const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        if (!inView(r) || !visible(e)) return;
        const thin = (r.height <= 4 && r.width >= 20) || (r.width <= 4 && r.height >= 20);
        const isSvg = /svg|line|path/.test(e.tagName.toLowerCase());
        const near = Math.abs(r.y - name.y) < 120 && r.x > name.x - 80 && r.x < name.x + 500;
        if ((thin || isSvg) && near) lines.push({ tag: e.tagName.toLowerCase(), x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, transform: cs.transform.slice(0, 40) });
      });
    }
    return { name, portrait: imgs.slice(0, 3), lines: lines.slice(0, 12), vw: innerWidth, vh: innerHeight };
  });
  console.log(JSON.stringify(data, null, 1));

  if (data.name) {
    const c = { x: Math.max(0, data.name.x - 60), y: Math.max(0, data.name.y - 40), width: 620, height: 260 };
    await page.screenshot({ path: DIR + "rm-name-crop.png", clip: c });
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
