// Capture the RM producers scene (project 6396534) and wheel through it to the
// end, screenshotting each producer so we can see where Allan sits.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\rm-producers\\";
const BASE = "https://readymag.website/u2412057466/6396534/5/";

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await p.goto(BASE, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3000));
  await p.evaluate(() => {
    const btn = document.getElementById("CybotCookiebotDialogBodyButtonDecline");
    if (btn) btn.click();
  }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));
  await p.screenshot({ path: DIR + "scene-diego.png" });

  // Wheel forward in steps, screenshotting; the RM scene pans horizontally.
  for (let step = 1; step <= 6; step++) {
    await p.mouse.move(800, 450);
    for (let i = 0; i < 18; i++) {
      await p.mouse.wheel({ deltaY: 120 });
      await new Promise((r) => setTimeout(r, 25));
    }
    await new Promise((r) => setTimeout(r, 900));
    await p.screenshot({ path: DIR + "scene-step" + step + ".png" });
  }
  await b.close();
  console.log("done");
})().catch((e) => { console.error(e.message); process.exit(1); });
