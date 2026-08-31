// Title band measured from the DIVIDER (the band's own top edge), which is what
// the eye reads. Anchoring on the title hid an absolute offset of the whole block.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const K = 1440 / 1024;
const route = process.argv[2] || "/blog";
// canvas 1024: rule 38.4, title ink 40.8, years ink 44.2, pill box 42, photos 68
const RM = { titleInk: 40.8 - 38.4, yearInk: 44.2 - 38.4, pill: 42 - 38.4, photos: 68 - 38.4 };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:8080" + route, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2200));
  const g = await page.evaluate(() => {
    const CAP = 0.717;
    const sec = document.querySelector("main > section");
    const inkTop = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); const fs = parseFloat(c.fontSize); return r.top + (r.height - fs * CAP) / 2; };
    return {
      rule: sec.getBoundingClientRect().top,
      title: inkTop(sec.querySelector("h1")),
      year: inkTop(sec.querySelectorAll("button")[0]),
      pill: sec.querySelector("input").getBoundingClientRect().top,
      photos: document.querySelector("article > div").getBoundingClientRect().top,
      bandH: sec.getBoundingClientRect().height,
    };
  });
  const P = (l, ours, rmCanvas) => {
    const rm = rmCanvas * K, d = ours - rm;
    console.log(`${l.padEnd(28)} nosso ${String(ours.toFixed(1)).padStart(7)}   RM ${String(rm.toFixed(1)).padStart(7)}   d ${(d >= 0 ? "+" : "") + d.toFixed(1)}${Math.abs(d) > 1.2 ? "   <<<" : ""}`);
  };
  console.log(`--- distancias a partir da regua (${route}) ---`);
  P("regua -> tinta do titulo", g.title - g.rule, RM.titleInk);
  P("regua -> tinta dos anos", g.year - g.rule, RM.yearInk);
  P("regua -> topo da pilula", g.pill - g.rule, RM.pill);
  P("regua -> topo das fotos", g.photos - g.rule, RM.photos);
  console.log(`altura da faixa: ${g.bandH.toFixed(1)}  (RM ${(RM.photos * K).toFixed(1)})`);
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
