// How does the LIVE Readymag page behave when the window is shorter than the
// scaled canvas? Answers the open question on /contact: does RM scale the
// canvas by WIDTH (and let the page scroll), or does it fit the viewport?
// Usage: node rm-scale-probe.cjs [pageIndex]   (6 = contact)
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const IDX = process.argv[2] || "6";
const URL = `https://readymag.website/u2412057466/6396534/${IDX}/`;
const SIZES = [
  [1280, 800], [1440, 900], [1440, 1200], [1600, 900], [1920, 1080], [1920, 700],
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  console.log(URL);
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(URL, { waitUntil: "networkidle2", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 3000));
    const m = await page.evaluate(() => {
      const bounds = document.querySelector(".page.center-page .content-bounds")
        || document.querySelector(".content-bounds");
      const b = bounds && bounds.getBoundingClientRect();
      const cs = bounds && getComputedStyle(bounds);
      // The scroll container is not always documentElement in the RM viewer.
      let scroller = null, best = 0;
      for (const el of document.querySelectorAll("body *")) {
        const over = el.scrollHeight - el.clientHeight;
        if (over > best && el.clientHeight > 200) { best = over; scroller = el; }
      }
      return {
        bounds: b && { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) },
        transform: cs && cs.transform,
        docScroll: document.documentElement.scrollHeight,
        bodyScroll: document.body.scrollHeight,
        innerH: innerHeight,
        maxOverflow: best,
        scrollerTag: scroller && (scroller.tagName + "." + String(scroller.className).slice(0, 40)),
        scrollerH: scroller && scroller.scrollHeight,
        scrollerClientH: scroller && scroller.clientHeight,
      };
    });
    const scale = m.bounds ? m.bounds.w / 1024 : 0;
    console.log(
      `\n${w}x${h}  bounds ${m.bounds ? `${m.bounds.w}x${m.bounds.h} @ (${m.bounds.x},${m.bounds.y})` : "-"}` +
      `  escala ${scale.toFixed(4)} (w/1024)  ${(scale * 1024 / w).toFixed(3)}x da largura`
    );
    console.log(`   transform ${m.transform}`);
    console.log(`   doc ${m.docScroll} / body ${m.bodyScroll} / innerH ${m.innerH}` +
      `  -> rola ${m.docScroll > m.innerH + 2 ? "SIM" : "NAO"}`);
    console.log(`   maior overflow interno ${m.maxOverflow} em ${m.scrollerTag} (${m.scrollerClientH} visivel de ${m.scrollerH})`);
  }
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
