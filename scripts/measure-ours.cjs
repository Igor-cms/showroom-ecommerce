// Measure OUR menu's key elements to compare against the RM export numbers.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.click('[aria-label="Open menu"]');
  await new Promise((r) => setTimeout(r, 700));
  const data = await page.evaluate(() => {
    const rep = (el) => { const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize, fw: cs.fontWeight }; };
    const byText = (txt) => [...document.querySelectorAll("a,button,p,span,div")]
      .filter((e) => !e.children.length && (e.textContent || "").trim() === txt).map(rep);
    const byPh = (ph) => { const i = document.querySelector(`input[placeholder="${ph}"]`);
      return i ? { ...rep(i), wrapper: rep(i.closest('[class*="rounded-full"]') || i.parentElement) } : null; };
    return { LOGIN: byText("Login"), CREATE: byText("Create Account"),
      SEARCH: byPh("SEARCH"), EMAIL: byPh("EMAIL"), PASSWORD: byPh("PASSWORD") };
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
