const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 820, deviceScaleFactor: 3 });
  await page.goto("http://localhost:8092/5/", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  // wide crop: from the name across the gap to the face, to see the arrow/connector
  await page.screenshot({ path: DIR + "rm-arrow-crop.png", clip: { x: 560, y: 150, width: 480, height: 220 } });
  // also dump svg path data near the name
  const svgs = await page.evaluate(() => {
    return [...document.querySelectorAll("svg")].map((s) => {
      const r = s.getBoundingClientRect();
      if (r.width < 1 || r.x < 500 || r.x > 1050 || r.y > 360 || r.y < 150) return null;
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        html: s.outerHTML.slice(0, 220) };
    }).filter(Boolean);
  });
  console.log(JSON.stringify(svgs, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
