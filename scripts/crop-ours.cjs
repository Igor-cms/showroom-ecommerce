const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 820, deviceScaleFactor: 3 });
  await p.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  await p.screenshot({ path: DIR + "ours-arrow-crop.png", clip: { x: 520, y: 150, width: 520, height: 240 } });
  await b.close();
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
