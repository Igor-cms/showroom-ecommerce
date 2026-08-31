// Does the header + coordinates bar stay put while the page scrolls?
// Client Iteration 2 (PDF p20) requires it on Blog + Podcast, "like other pages".
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const route = process.argv[2] || "/blog";

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true });
  await p.goto("http://localhost:8080" + route, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  const read = () =>
    p.evaluate(() => {
      const t = [...document.querySelectorAll("*")].find(
        (e) => e.children.length === 0 && (e.textContent || "").trim().startsWith("MEDELLIN")
      );
      return t ? +t.getBoundingClientRect().top.toFixed(1) : null;
    });
  const before = await read();
  await p.evaluate(() => window.scrollTo(0, 1400));
  await new Promise((r) => setTimeout(r, 700));
  const after = await read();
  await b.close();
  const stuck = before !== null && after !== null && Math.abs(after - before) < 4;
  console.log(
    `${route.padEnd(10)} coords top ${before} -> ${after}   ${stuck ? "STICKY ok" : "NOT sticky (scrolls away)"}`
  );
})().catch((e) => { console.error(e.message); process.exit(1); });
