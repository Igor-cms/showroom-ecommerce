// Open the Readymag export, click "Menu", screenshot the real overlay, and dump
// exact computed styles for the inputs + their pill wrappers and the LOGIN button.
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
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto("http://localhost:8090/index.html", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500));

  // Click the "Menu" trigger.
  const clicked = await page.evaluate(() => {
    const els = [...document.querySelectorAll("a,button,[onclick],[role=button],div,span")];
    const t = els.find((el) => (el.getAttribute("aria-label") || el.textContent || "").trim() === "Menu");
    if (t) { t.click(); return true; }
    return false;
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({ path: DIR + "rm-menu-full.png" });

  const data = await page.evaluate(() => {
    const pick = (cs, keys) => Object.fromEntries(keys.map((k) => [k, cs[k]]));
    const boxKeys = ["fontSize", "fontWeight", "letterSpacing", "fontFamily", "color",
      "height", "width", "borderTopWidth", "borderTopStyle", "borderTopColor",
      "borderRadius", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "backgroundColor", "textAlign"];

    // All inputs + their ancestor chain (to find the pill wrapper that carries border/radius).
    const inputs = [...document.querySelectorAll("input,textarea")].map((inp) => {
      const r = inp.getBoundingClientRect();
      const chain = [];
      let n = inp, depth = 0;
      while (n && depth < 5) {
        const cs = getComputedStyle(n);
        const rr = n.getBoundingClientRect();
        chain.push({
          tag: n.tagName.toLowerCase(),
          w: Math.round(rr.width), h: Math.round(rr.height),
          borderRadius: cs.borderRadius, borderTopWidth: cs.borderTopWidth,
          borderTopColor: cs.borderTopColor, borderTopStyle: cs.borderTopStyle,
          padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
          backgroundColor: cs.backgroundColor,
        });
        n = n.parentElement; depth++;
      }
      return {
        placeholder: inp.placeholder, type: inp.type,
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        input: pick(getComputedStyle(inp), boxKeys),
        ancestors: chain,
      };
    });

    // The LOGIN pill button (dark background, text LOGIN).
    const loginBtns = [...document.querySelectorAll("a,button,div,span")]
      .filter((el) => (el.textContent || "").trim().toUpperCase() === "LOGIN")
      .map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height), ...pick(cs, boxKeys) };
      });

    return { inputCount: inputs.length, inputs, loginBtns };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
