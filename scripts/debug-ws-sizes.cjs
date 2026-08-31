// Report the computed size of the wholesale page's key mobile elements at a
// phone width, next to the Readymag targets (9px on a 320 canvas etc).
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const W = parseInt(process.argv[2] || "375", 10);

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: W, height: 812, deviceScaleFactor: 1, isMobile: true });
  await p.goto("http://localhost:8080/wholesale-request", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  const out = await p.evaluate(() => {
    const g = (sel, label) => {
      const e = document.querySelector(sel);
      if (!e) return { label, missing: true };
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      return { label, fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight, h: +r.height.toFixed(1), w: +r.width.toFixed(1) };
    };
    // the page's own form input — NOT the menu overlay's search box, which also
    // lives in the DOM and would otherwise be picked up first
    const inputs = [...document.querySelectorAll('form input#first_name, form input')];
    const rows = [...document.querySelectorAll('form > div.border-b')];
    return {
      vw: window.innerWidth,
      tagline: g('header div div, .shrink-0 + div', 'tagline'),
      firstInput: inputs[0] ? (() => { const cs = getComputedStyle(inputs[0]); const r = inputs[0].getBoundingClientRect();
        return { label: 'input', fs: cs.fontSize, h: +r.height.toFixed(1) }; })() : null,
      rowPitch: rows.length > 1 ? +(rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top).toFixed(1) : null,
      h1: g('h1', 'headline'),
      h2: g('h2', 'programme details heading'),
      submit: g('button[type=submit]', 'submit'),
    };
  });
  await b.close();
  const s = 320 / out.vw; // scale our px back onto RM's 320 canvas
  const on320 = (px) => (parseFloat(px) * s).toFixed(1);
  console.log(`viewport ${out.vw}px  (values in brackets = converted to RM's 320 canvas)\n`);
  console.log(`  input font   ${out.firstInput.fs}  [${on320(out.firstInput.fs)}]   RM 9`);
  console.log(`  row pitch    ${out.rowPitch}px  [${on320(out.rowPitch + 'px')}]   RM 36`);
  console.log(`  headline     ${out.h1.fs}  [${on320(out.h1.fs)}]   RM 53`);
  console.log(`  details h2   ${out.h2.fs} w${out.h2.fw}  [${on320(out.h2.fs)}]   RM 12 bold`);
  console.log(`  submit       ${out.submit.fs} h${out.submit.h}  [fs ${on320(out.submit.fs)} / h ${on320(out.submit.h + 'px')}]   RM fs 9 / h 13`);
})().catch((e) => { console.error(e.message); process.exit(1); });
