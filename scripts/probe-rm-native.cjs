// Probe the published "(Copy) Native - for Lucas" Readymag project: list its
// pages and find the Producers one.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "https://readymag.website/u3607562444/6351261/";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3000));

  const info = await page.evaluate(() => {
    const out = { title: document.title, url: location.href };
    // RM viewer exposes the mag structure on window (varies by version)
    const rm = window.RM || window.rm || {};
    try {
      const mag =
        rm.mag || rm.magazine || (rm.viewer && rm.viewer.mag) || null;
      if (mag && mag.pages) {
        out.pages = mag.pages.map((p, i) => ({ i, id: p._id || p.id, title: p.title || "" }));
      }
    } catch (e) {
      out.err = String(e);
    }
    // Fallback: harvest anchors
    out.links = [...document.querySelectorAll("a[href]")]
      .map((a) => ({ href: a.getAttribute("href"), t: (a.textContent || "").trim().slice(0, 40) }))
      .filter((l) => l.href && !l.href.startsWith("mailto"))
      .slice(0, 40);
    out.text = document.body.innerText.replace(/\s+/g, " ").slice(0, 600);
    return out;
  });
  console.log(JSON.stringify(info, null, 1).slice(0, 4000));
  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
