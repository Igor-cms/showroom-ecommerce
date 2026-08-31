// Render BOTH the RM producers page and our /producers at the target aspect (1.88)
// so they can be compared to the target screenshot. Pass "rm" or "ours" or "both".
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
const W = 1512, H = 803; // aspect 1.883 ≈ target
const which = process.argv[2] || "ours";

async function shoot(url, out, isRM) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, isRM ? 4000 : 1500));
  await page.screenshot({ path: DIR + out });
  await browser.close();
  console.log("saved " + out);
}

(async () => {
  if (which === "rm" || which === "both") await shoot("http://localhost:8092/5/", "cmp-rm.png", true);
  if (which === "ours" || which === "both") await shoot("http://localhost:8080/producers", "cmp-ours.png", false);
})().catch((e) => { console.error(e); process.exit(1); });
