// Measure the mobile producer popup: is the title wider than the panel?
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true });
  await p.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise(r => setTimeout(r, 2200));
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(e => e.textContent.trim() === "MY STORY");
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 900));
  const m = await p.evaluate(() => {
    const aside = document.querySelector("aside");
    if (!aside) return { err: "no panel" };
    const h3 = aside.querySelector("h3");
    const cs = getComputedStyle(aside);
    const head = h3.parentElement;
    return {
      panelCss: cs.width,
      panelOnScreen: +aside.getBoundingClientRect().width.toFixed(1),
      scale: cs.transform,
      titleFs: getComputedStyle(h3).fontSize,
      titleScrollW: h3.scrollWidth,
      headClientW: head.clientWidth,
      headScrollW: head.scrollWidth,
      overflowPx: h3.scrollWidth - head.clientWidth,
      labelBlockW: +head.lastElementChild.getBoundingClientRect().width.toFixed(1),
      labelEls: [...head.lastElementChild.querySelectorAll("*")].map((e) => ({
        tag: e.tagName, txt: (e.textContent || "").trim().slice(0, 12),
        transform: getComputedStyle(e).transform,
        left: +e.getBoundingClientRect().left.toFixed(1),
        right: +e.getBoundingClientRect().right.toFixed(1),
      })),
      surnameRight: +aside.querySelector("h3 span").getBoundingClientRect().right.toFixed(1),
      labelFs: getComputedStyle(head.lastElementChild.querySelector("span,p,div") || head.lastElementChild).fontSize,
      headOverflow: head.scrollWidth - head.clientWidth,
    };
  });
  await b.close();
  console.log(JSON.stringify(m, null, 1));
})().catch(e => { console.error(e.message); process.exit(1); });
