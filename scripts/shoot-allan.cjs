// Capture the Producers scene at Allan (progress 2) at EXACTLY 1600×900 so the
// stage renders at scale 1.0 (whole stage visible, no cover-cropping) — this lets
// us overlay/measure directly against the RM reference scene-step6.png (1600×900).
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));

  // Wheel-scroll inside the scene until progress reaches 2 (Allan).
  for (let i = 0; i < 60; i++) {
    await page.mouse.move(800, 450);
    await page.mouse.wheel({ deltaY: 90 });
    await new Promise((r) => setTimeout(r, 40));
  }
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: DIR + "producers-allan.png" });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
