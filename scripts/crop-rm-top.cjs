const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 2 });
  await page.goto("http://localhost:8091/index.html", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500));
  await page.evaluate(() => {
    const L = [...document.querySelectorAll(".above-pages-container")];
    L.forEach((c, i) => { if (i === 0) { c.style.opacity = "1"; c.style.visibility = "visible"; c.style.zIndex = "99999";
      c.querySelectorAll("*").forEach((e) => { e.style.opacity = "1"; e.style.visibility = "visible"; }); } else c.style.display = "none"; });
    document.querySelectorAll(".mag-pages-container > *").forEach((e) => { if (!e.classList.contains("above-pages-container")) e.style.opacity = "0"; });
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: DIR + "rm-top-right.png", clip: { x: 690, y: 0, width: 460, height: 240 } });
  await browser.close();
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
