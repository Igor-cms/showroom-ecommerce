const puppeteer = require("puppeteer-core");
const CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await p.goto("http://localhost:8080/", { waitUntil: "networkidle2", timeout: 60000 });
  await p.click('[aria-label="Open menu"]');
  await new Promise((r) => setTimeout(r, 700));
  const d = await p.evaluate(() => {
    const title = [...document.querySelectorAll("p")].find((e) => /wholesale portal/i.test(e.textContent));
    const input = document.querySelector('input[placeholder="EMAIL"]');
    return { titleW: Math.round(title.getBoundingClientRect().width),
             inputW: Math.round(input.getBoundingClientRect().width) };
  });
  console.log(JSON.stringify(d));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
