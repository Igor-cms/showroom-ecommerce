// Where does the mobile shop card's height come from?
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true });
  await p.goto("http://localhost:8080/shop", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  const m = await p.evaluate(() => {
    const card = document.querySelector("[data-card-root]");
    if (!card) return { err: "no [data-card-root]" };
    const h = (e) => (e ? +e.getBoundingClientRect().height.toFixed(1) : null);
    const parts = {};
    for (const k of ["image", "title", "price", "process", "notes"]) {
      parts[k] = h(card.querySelector('[data-card-layer="' + k + '"]'));
    }
    const chain = [];
    let n = card;
    for (let i = 0; i < 4 && n; i++) {
      const c = getComputedStyle(n);
      chain.push({
        tag: n.tagName, cls: String(n.className).slice(0, 44), h: h(n),
        pad: c.paddingTop + "/" + c.paddingBottom, minH: c.minHeight, gap: c.rowGap,
      });
      n = n.parentElement;
    }
    return {
      cards: document.querySelectorAll("[data-card-root]").length,
      cardH: h(card), parts, chain, pageH: document.body.scrollHeight,
    };
  });
  await b.close();
  console.log(JSON.stringify(m, null, 1));
})().catch((e) => { console.error(e.message); process.exit(1); });
