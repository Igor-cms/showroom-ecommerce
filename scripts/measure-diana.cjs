// Scroll the /producers scene to progress 1 (Diana) and screenshot + measure her.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await p.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  // move mouse into the scene, then wheel down repeatedly to reach progress 1 (Diana)
  await p.mouse.move(800, 450);
  for (let i = 0; i < 28; i++) { await p.mouse.wheel({ deltaY: 120 }); await new Promise((r) => setTimeout(r, 90)); }
  await new Promise((r) => setTimeout(r, 1500));
  await p.screenshot({ path: DIR + "diana-1600.png" });
  const data = await p.evaluate(() => {
    const box = (el) => { const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2) }; };
    const img = document.querySelector('img[alt="DIANA HARTMANN"]');
    const name = [...document.querySelectorAll("h2")].find((e) => /DIANA HARTMANN/i.test(e.textContent));
    const hs = [...document.querySelectorAll("button")].filter((bn) => /MY STORY|HOT TAKES|INTERVIEW|MY COFFEES/i.test(bn.textContent))
      .map((bn) => ({ label: bn.textContent.trim().slice(0, 12), ...box(bn) }));
    return { portraitImg: img ? box(img) : null, name: name ? box(name) : null,
      hotspots: hs.filter((h) => h.y > 0 && h.y < 900) };
  });
  console.log(JSON.stringify(data, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
