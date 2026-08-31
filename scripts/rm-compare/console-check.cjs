const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const route = process.argv[2] || "/shop";
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const msgs = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") msgs.push(m.type() + ": " + m.text().slice(0, 300)); });
  page.on("pageerror", (e) => msgs.push("pageerror: " + e.message.slice(0, 300)));
  await page.setViewport({ width: 320, height: 900, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:8080" + route, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));
  await page.evaluate(() => window.scrollTo(0, 3000));
  await new Promise((r) => setTimeout(r, 1500));
  console.log(msgs.length ? msgs.join("\n") : "NO ERRORS/WARNINGS");
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
