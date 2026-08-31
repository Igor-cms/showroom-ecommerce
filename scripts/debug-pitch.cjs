// What does the hook actually produce in the page, vs what we expect?
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  for (const [w, dsf] of [[320, 1.25], [375, 1.25], [375, 2], [430, 1.25]]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: 260, deviceScaleFactor: dsf, isMobile: true });
    await p.goto("http://localhost:8080/contact", { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 900));
    const r = await p.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Open menu"]');
      const box = btn.firstElementChild;
      const cs = getComputedStyle(box);
      const spans = [...box.querySelectorAll("span")].map((s) => s.getBoundingClientRect());
      return {
        dpr: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        cssGap: cs.rowGap,
        barH: spans[0].height,
        pitch: spans[1].top - spans[0].top,
        tops: [spans[0].top, spans[1].top],
      };
    });
    await p.close();
    const devPitch = r.pitch * r.dpr;
    console.log(
      `vp=${w} dsf=${dsf} | dpr=${r.dpr} innerW=${r.innerWidth} gap=${r.cssGap} barH=${r.barH} ` +
      `pitch=${r.pitch.toFixed(3)} -> pitch*dpr=${devPitch.toFixed(3)} ` +
      `${Number.isInteger(+devPitch.toFixed(6)) ? "INTEGER ok" : "FRACTIONAL <-- problem"}`
    );
  }
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
