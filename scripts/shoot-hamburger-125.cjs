// Capture the mobile header at 125% browser zoom (deviceScaleFactor 1.25) —
// the zoom where the two hairlines used to rasterise differently.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 375, height: 400, deviceScaleFactor: 1.25, isMobile: true });
  await p.goto("http://localhost:8080/contact", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  await p.screenshot({ path: DIR + "hamburger-125.png" });
  await b.close();
  console.log("done");
})().catch((e) => { console.error(e.message); process.exit(1); });
