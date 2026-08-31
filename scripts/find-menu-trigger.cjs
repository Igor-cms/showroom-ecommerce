// Find what actually opens the RM menu overlay. Try candidate triggers; after each
// click, check whether the overlay text (CREATE ACCOUNT / WHOLESALE PORTAL) appeared.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";

const overlayOpen = () =>
  /CREATE ACCOUNT|WHOLESALE PORTAL/i.test(document.body.innerText);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto("http://localhost:8090/index.html", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500));

  // Build a list of candidate triggers: anything whose text/aria == "Menu", plus the
  // top-right-most small clickables, plus elements with menu-ish class/id.
  const candidates = await page.evaluate(() => {
    const out = [];
    const els = [...document.querySelectorAll("a,button,div,span,[onclick],[role=button]")];
    els.forEach((el, i) => {
      const label = (el.getAttribute("aria-label") || el.textContent || "").trim();
      const cls = (el.className && el.className.toString) ? el.className.toString() : "";
      const r = el.getBoundingClientRect();
      const menuish = /^menu$/i.test(label) || /menu|burger|hamburg|nav-?toggle/i.test(cls);
      const topRightSmall = r.top < 60 && r.right > window.innerWidth - 120 && r.width < 60 && r.width > 6 && r.height < 40;
      if (menuish || topRightSmall) {
        el.setAttribute("data-cand", String(i));
        out.push({ i, label: label.slice(0, 20), cls: cls.slice(0, 30),
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), menuish });
      }
    });
    return out;
  });
  console.log("CANDIDATES:\n" + JSON.stringify(candidates, null, 1));

  for (const c of candidates) {
    const res = await page.evaluate((i) => {
      const isOpen = () => /CREATE ACCOUNT|WHOLESALE PORTAL/i.test(document.body.innerText);
      const before = isOpen();
      const el = document.querySelector(`[data-cand="${i}"]`);
      if (el) el.click();
      return { before };
    }, c.i);
    await new Promise((r) => setTimeout(r, 1200));
    const after = await page.evaluate(() => /CREATE ACCOUNT|WHOLESALE PORTAL/i.test(document.body.innerText));
    console.log(`click cand#${c.i} "${c.label}" (${c.cls}) -> overlayOpen=${after}`);
    if (after) {
      await page.screenshot({ path: DIR + "rm-menu-open.png" });
      console.log("OPENED via candidate #" + c.i + " — screenshot saved.");
      break;
    }
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
