const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await p.goto("http://localhost:8080/", { waitUntil: "networkidle2", timeout: 60000 });
  await p.click('[aria-label="Open menu"]');
  await new Promise((r) => setTimeout(r, 700));
  await p.screenshot({ path: "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\menu-1920.png" });
  const d = await p.evaluate(() => {
    const searchPill = document.querySelector('input[placeholder="SEARCH"]').parentElement;
    const login = [...document.querySelectorAll("a")].find((e) => e.textContent.trim() === "Login");
    const sp = searchPill.getBoundingClientRect();
    const lo = login.getBoundingClientRect();
    return { searchW: Math.round(sp.width), searchBottom: Math.round(sp.bottom),
             loginTop: Math.round(lo.top), gap: Math.round(lo.top - sp.bottom) };
  });
  console.log(JSON.stringify(d));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
