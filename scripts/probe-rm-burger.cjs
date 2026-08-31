// Inspect what element sits under the hamburger in the RM mockup home, then
// click it for real and report what happens (menu overlay? page nav?).
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 900 });
  await p.goto("https://readymag.website/u2412057466/6396534/", { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3000));
  await p.evaluate(() => {
    const btn = document.getElementById("CybotCookiebotDialogBodyButtonDecline");
    if (btn) btn.click();
  }).catch(() => {});
  await new Promise((r) => setTimeout(r, 600));

  const info = await p.evaluate(() => {
    const pts = [[1564, 20], [1564, 26], [1572, 16]];
    return pts.map(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return { x, y, chain: null };
      const chain = [];
      let n = el;
      for (let i = 0; i < 6 && n; i++) {
        chain.push(n.tagName + "." + String(n.className).slice(0, 44) + (n.href ? " href=" + n.href : ""));
        n = n.parentElement;
      }
      return { x, y, chain };
    });
  });
  console.log(JSON.stringify(info, null, 1));

  await p.mouse.click(1564, 20);
  await new Promise((r) => setTimeout(r, 2500));
  console.log("after click url:", p.url());
  const snap = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 300));
  console.log("text:", snap);
  await p.screenshot({ path: "scripts/rm-menu/after-click.png" });
  await b.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
