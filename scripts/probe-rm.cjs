// Load the Readymag HTML export in real Chrome, let its runtime render, then
// screenshot + probe the LIVE DOM for the menu (the static files didn't show it).
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
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.goto("http://localhost:8090/index.html", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500)); // let RM runtime build the DOM

  await page.screenshot({ path: DIR + "rm-home.png" });

  const info = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const has = (s) => bodyText.toUpperCase().includes(s);
    // candidate menu/hamburger triggers
    const clickables = [...document.querySelectorAll("a,button,[onclick],[role=button]")]
      .map((el) => (el.getAttribute("aria-label") || el.textContent || el.className || "").trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 60);
    return {
      title: document.title,
      url: location.href,
      bodyLen: bodyText.length,
      menuStrings: {
        PRODUCERS: has("PRODUCERS"),
        "COFFEE LEVELS": has("COFFEE LEVELS"),
        "WHOLESALE PORTAL": has("WHOLESALE PORTAL"),
        "ABOUT US": has("ABOUT US"),
        "CREATE ACCOUNT": has("CREATE ACCOUNT"),
      },
      sampleText: bodyText.replace(/\s+/g, " ").slice(0, 400),
      clickables,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  if (errors.length) console.log("PAGE ERRORS:\n" + errors.slice(0, 5).join("\n"));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
