const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await p.goto("http://localhost:8080/", { waitUntil: "networkidle2", timeout: 60000 });
  await p.click('[aria-label="Open menu"]');
  await new Promise((r) => setTimeout(r, 700));
  await p.screenshot({ path: "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\menu-1920.png" });
  const data = await p.evaluate(() => {
    const nav = document.querySelector("nav");
    const navBox = nav.getBoundingClientRect();
    const cs = getComputedStyle(nav);
    const innerLeft = navBox.left + parseFloat(cs.paddingLeft);
    const innerRight = navBox.right - parseFloat(cs.paddingRight);
    const labels = [...nav.querySelectorAll("a span:last-child")].map((s) => {
      const r = s.getBoundingClientRect();
      return { t: s.textContent.trim(), right: Math.round(r.right), w: Math.round(r.width) };
    });
    const widest = labels.reduce((a, c) => (c.w > a.w ? c : a), labels[0]);
    return { panelInnerRight: Math.round(innerRight), panelInnerWidth: Math.round(innerRight - innerLeft),
      widest, headroom: Math.round(innerRight - widest.right) };
  });
  console.log(JSON.stringify(data, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
