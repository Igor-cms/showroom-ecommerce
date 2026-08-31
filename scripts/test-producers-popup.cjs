// Client Iteration 2 (PDF p19): tapping a producer button must open a popup in
// the current window. Clicks each producer's three buttons and checks a panel
// appears, and that the pills are fully on screen.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));

  const clipped = await p.evaluate(() =>
    [...document.querySelectorAll("button")]
      .filter((e) => ["MY STORY", "INTERVIEWS", "SHOP COFFEES"].includes(e.textContent.trim()))
      .map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), left: Math.round(r.left), right: Math.round(r.right) }; })
      .filter((r) => r.left < 0 || r.right > 375)
  );
  console.log(clipped.length ? "OFF-SCREEN pills: " + JSON.stringify(clipped) : "all pills fully on screen");

  const labels = ["MY STORY", "INTERVIEWS", "SHOP COFFEES"];
  for (let i = 0; i < 3; i++) {
    for (const label of labels) {
      const opened = await p.evaluate(async (label, i) => {
        const btns = [...document.querySelectorAll("button")].filter((e) => e.textContent.trim() === label);
        if (!btns[i]) return "missing";
        btns[i].click();
        await new Promise((r) => setTimeout(r, 700));
        // the panel is an aside/dialog carrying the producer's name as a heading
        const panel = document.querySelector("aside, [role=dialog]");
        const open = !!panel && panel.getBoundingClientRect().width > 100;
        const title = open ? (panel.querySelector("h1,h2,h3") || {}).textContent : null;
        // close again
        const close = panel && panel.querySelector("button");
        if (close) close.click();
        await new Promise((r) => setTimeout(r, 400));
        return open ? "open: " + (title || "").trim().slice(0, 26) : "DID NOT OPEN";
      }, label, i);
      console.log(`  producer ${i + 1} / ${label.padEnd(13)} -> ${opened}`);
    }
  }

  // capture one open panel for review
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((e) => e.textContent.trim() === "MY STORY");
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await p.screenshot({ path: DIR + "producers-popup.png" });
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
