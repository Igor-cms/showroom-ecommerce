// Correct RM export: open the real menu overlay (verify big nav visible) and extract
// the pill DIVS behind SEARCH/EMAIL/PASSWORD (RM draws them as text in bordered divs).
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
const BASE = "http://localhost:8091/index.html";

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500));

  const bigNavVisible = () => {
    return [...document.querySelectorAll("*")].some((e) => {
      const t = (e.textContent || "").trim();
      if (!/^(HOME|SHOP|PRODUCERS|ABOUT US|CONTACT)$/i.test(t)) return false;
      const fs = parseFloat(getComputedStyle(e).fontSize);
      const r = e.getBoundingClientRect();
      return fs >= 34 && r.width > 0 && r.top >= -20 && r.top < window.innerHeight;
    });
  };

  // Candidate triggers: small clickables in the top corners.
  const cands = await page.evaluate(() => {
    const out = [];
    [...document.querySelectorAll("a,button,div,span,[onclick],[role=button],svg")].forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const topCorner = r.top < 80 && r.width < 80 && r.width > 6 && r.height < 60 &&
        (r.right > window.innerWidth - 140 || r.left < 140);
      if (topCorner) { el.setAttribute("data-cand", i); out.push(i); }
    });
    return out;
  });

  let opened = false, used = -1;
  for (const i of cands) {
    await page.evaluate((i) => document.querySelector(`[data-cand="${i}"]`)?.click(), i);
    await new Promise((r) => setTimeout(r, 900));
    opened = await page.evaluate(bigNavVisible);
    if (opened) { used = i; break; }
  }
  console.log("opened=" + opened + " via #" + used);

  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: DIR + "rm-correct-menu.png" });

  const data = await page.evaluate(() => {
    const vis = (r) => r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
    // text elements for the placeholders / labels we care about
    const labelOf = (x, y) => {
      let best = null, bd = 1e9;
      [...document.querySelectorAll("*")].forEach((e) => {
        const t = (e.textContent || "").trim();
        if (!t || t.length > 14 || e.children.length) return;
        const r = e.getBoundingClientRect();
        const d = Math.hypot(r.left - x, r.top - y);
        if (d < bd) { bd = d; best = t; }
      });
      return best;
    };
    // Pill-like elements: rounded + small height, visible.
    const pills = [...document.querySelectorAll("div,a,button,span")].map((el) => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return { el, cs, r };
    }).filter(({ cs, r }) => {
      const rad = parseFloat(cs.borderTopLeftRadius) || 0;
      const rounded = rad >= 8 || cs.borderTopLeftRadius.includes("%");
      const borderedOrFilled = cs.borderTopStyle !== "none" || /rgb\((?!.*0, 0, 0, 0)/.test(cs.backgroundColor) && cs.backgroundColor !== "rgba(0, 0, 0, 0)";
      return vis(r) && rounded && r.height >= 12 && r.height <= 44 && r.width >= 70 && r.width <= 420 && borderedOrFilled;
    }).map(({ cs, r }) => ({
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      borderRadius: cs.borderTopLeftRadius, borderW: cs.borderTopWidth, borderStyle: cs.borderTopStyle,
      borderColor: cs.borderTopColor, bg: cs.backgroundColor,
      pad: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      nearLabel: labelOf(r.x + 8, r.y + r.height / 2),
    })).sort((a, b) => a.y - b.y);
    return { pills };
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
