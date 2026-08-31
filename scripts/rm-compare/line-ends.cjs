// Where does each leader line END, in 1600x900 stage coordinates? Pair this
// with silhouette-edge.py (which reads the cutout's alpha) to see how far each
// line falls short of — or overshoots into — the producer's body.
// Usage: node line-ends.cjs <ticks>   (0 Diego, ~16 Diana, ~31 Allan)
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.DEV_URL || "http://localhost:8080";
const TICKS = parseInt(process.argv[2] || "0", 10);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto(BASE + "/producers", { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3800));
  if (TICKS) {
    await page.evaluate((n) => {
      const el = document.querySelector("div.relative.overflow-hidden");
      for (let i = 0; i < n; i++) el.dispatchEvent(new WheelEvent("wheel", { deltaY: 90, bubbles: true, cancelable: true }));
    }, TICKS);
    await new Promise((r) => setTimeout(r, 2000));
  }

  const out = await page.evaluate(() => {
    // The stage is the 1600-wide box that everything is authored against.
    const stage = [...document.querySelectorAll("div")]
      .find((d) => d.style.width === "1600px" && d.style.height === "900px");
    const sr = stage.getBoundingClientRect();
    const k = sr.width / 1600;
    const toStage = (x, y) => [+((x - sr.left) / k).toFixed(1), +((y - sr.top) / k).toFixed(1)];

    const res = [];
    // The name's own leader line: a rotated span anchored at the name block's
    // right edge. Reported first because it is authored separately from the pills.
    const names = [];
    for (const h2 of document.querySelectorAll("h2")) {
      const block = h2.parentElement;
      if (+getComputedStyle(block).opacity < 0.5) continue;
      const line = block.querySelector("span[style*='rotate']");
      const br = block.getBoundingClientRect();
      const [bx, by] = toStage(br.left, br.top);
      const [brx] = toStage(br.right, br.top);
      let start = null, end = null;
      if (line) {
        const lr = line.getBoundingClientRect();
        start = toStage(lr.left, lr.top);
        end = toStage(lr.right, lr.bottom);
      }
      names.push({ who: h2.textContent.trim(), block: { x: bx, y: by, right: brx }, start, end });
    }
    res.push({ __names: names });
    for (const btn of document.querySelectorAll("button")) {
      const label = btn.textContent.trim().toUpperCase();
      if (!/^(MY STORY|INTERVIEW|MY COFFEES)$/.test(label)) continue;
      if (getComputedStyle(btn).pointerEvents === "none") continue; // hidden producer
      let slot = btn.parentElement;
      while (slot && !slot.querySelector("h2")) slot = slot.parentElement;
      const who = slot.querySelector("h2").textContent.trim();
      // The matching connector line lives in the sibling group at the same top/left.
      const lineWrap = [...slot.children].find((c) =>
        c !== btn && c.style && c.style.top === btn.style.top && c.style.left === btn.style.left
      );
      const line = lineWrap && lineWrap.querySelector("span[style*='rotate']");
      const br = btn.getBoundingClientRect();
      const [px, py] = toStage(br.left, br.top);
      const [pr] = toStage(br.right, br.top);
      let end = null;
      if (line) {
        const lr = line.getBoundingClientRect();
        // Every lineDeg is positive (down-right), so the far end is bottom-right.
        end = toStage(lr.right, lr.bottom);
      }
      res.push({ who, label, pill: { x: px, y: py, right: pr, w: +(pr - px).toFixed(1) }, end });
    }
    return res;
  });

  console.log(`--- ${TICKS} ticks ---`);
  for (const r of out) {
    if (r.__names) {
      for (const n of r.__names) {
        console.log(`  ${n.who.padEnd(15)} NOME        bloco x ${String(n.block.x).padStart(6)}..${String(n.block.right).padStart(6)}  topo y ${n.block.y}`);
        if (n.start) console.log(`  ${" ".repeat(27)} linha ${n.start[0]},${n.start[1]}  ->  ${n.end[0]},${n.end[1]}`);
      }
      continue;
    }
    console.log(`  ${r.who.padEnd(15)} ${r.label.padEnd(11)} pilula x ${String(r.pill.x).padStart(6)}..${String(r.pill.right).padStart(6)} (larg ${r.pill.w})  topo y ${r.pill.y}`);
    if (r.end) console.log(`  ${" ".repeat(27)} linha termina em x ${String(r.end[0]).padStart(6)}  y ${String(r.end[1]).padStart(6)}`);
  }
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
