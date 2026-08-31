const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await p.goto("http://localhost:8080/", { waitUntil: "networkidle2", timeout: 60000 });
  await p.click('[aria-label="Open menu"]');
  await new Promise((r) => setTimeout(r, 700));
  const d = await p.evaluate(() => {
    const title = [...document.querySelectorAll("p")].find((e) => /wholesale portal/i.test(e.textContent));
    const wpBlock = title.closest("div").parentElement === null ? title.parentElement : title.closest("div");
    // the border div is the parent that has border-t
    let border = title.parentElement;
    while (border && !/(^|\s)border-t/.test(border.className)) border = border.parentElement;
    const info = [...document.querySelectorAll("p")].find((e) => e.textContent.trim() === "Info");
    const content = title.closest(".overflow-y-auto");
    return {
      wpBorderTop: border ? Math.round(border.getBoundingClientRect().top) : null,
      infoTop: Math.round(info.getBoundingClientRect().top),
      infoBottom: Math.round(info.parentElement.getBoundingClientRect().bottom),
      contentScrollH: content.scrollHeight,
      contentClientH: content.clientHeight,
      overflow: content.scrollHeight - content.clientHeight,
      panelH: 1080,
    };
  });
  console.log(JSON.stringify(d, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
