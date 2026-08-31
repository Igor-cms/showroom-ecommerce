const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  for (const [w, h] of [[1600, 900], [1920, 1080]]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await p.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1800));
    await p.screenshot({ path: DIR + `ours-${w}.png` });
    await p.close();
    console.log("shot", w);
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
