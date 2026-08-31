// Reproduce the MY COFFEES pagination bug: open Diego's coffees, page forward,
// and screenshot each page.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await p.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  await p.evaluate(() => {
    // Diego is the active producer at progress 0 → his MY COFFEES is the FIRST.
    const btn = [...document.querySelectorAll("button")].filter((x) => x.textContent.trim() === "MY COFFEES")[0];
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 2500));
  const info = await p.evaluate(() => {
    const dots = document.querySelectorAll('aside button[aria-label^="Page"]').length;
    return { pages: dots };
  });
  console.log("pages:", JSON.stringify(info));
  await p.screenshot({ path: DIR + "coffees-p1.png" });
  for (let pg = 2; pg <= 3; pg++) {
    await p.evaluate(() => {
      const n = [...document.querySelectorAll('button[aria-label="Next"]')].pop();
      if (n) n.click();
    });
    await new Promise((r) => setTimeout(r, 900));
    await p.screenshot({ path: DIR + "coffees-p" + pg + ".png" });
  }
  await b.close();
  console.log("done");
})().catch((e) => { console.error(e.message); process.exit(1); });
