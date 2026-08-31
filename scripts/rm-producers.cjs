const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 820, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8092/5/", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: DIR + "rm-producers-page.png" });

  const data = await page.evaluate(() => {
    const els = [...document.querySelectorAll("*")]
      .filter((e) => !e.children.length && /DIEGO BERMUDEZ/i.test((e.textContent || "").trim())
        && !/window\.RM|var RM/.test(e.textContent));
    return els.map((e) => {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      const visible = r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && +cs.opacity > 0.05 && r.top < window.innerHeight && r.bottom > 0;
      return { visible, color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight, textShadow: cs.textShadow,
        fontFamily: cs.fontFamily.split(",")[0],
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
  });
  console.log("VISIBLE NAMES:");
  console.log(JSON.stringify(data.filter((d) => d.visible), null, 1));
  console.log("ALL (count " + data.length + "):");
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
