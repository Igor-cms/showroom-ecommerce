const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: DIR + "ours-1600.png" });
  const data = await page.evaluate(() => {
    const box = (el) => { const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) }; };
    const img = document.querySelector('img[alt="DIEGO BERMUDEZ"]');
    const name = [...document.querySelectorAll("h2")].find((e) => /DIEGO BERMUDEZ/i.test(e.textContent));
    const hs = [...document.querySelectorAll("button")].filter((b) => /MY STORY|HOT TAKES|INTERVIEW|MY COFFEES/i.test(b.textContent))
      .map((b) => ({ label: b.textContent.trim().slice(0, 12), ...box(b) }));
    return { portraitImg: img ? box(img) : null, name: name ? box(name) : null, hotspots: hs };
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
