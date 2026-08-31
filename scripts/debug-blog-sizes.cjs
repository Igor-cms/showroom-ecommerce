// Measure the blog/podcast card against the Readymag mobile canvas (320 wide).
// Every value is converted back onto that canvas so it can be read next to the
// RM targets directly.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const route = process.argv[2] || "/blog";
const W = parseInt(process.argv[3] || "375", 10);

// measured off RM preview/8 at stage width 320
const RM = {
  gutter: 5, imageW: 320, imageH: 318,
  titleFs: 8, titleLh: 8,
  excerptFs: 7, excerptLh: 8, excerptItalic: true,
  pillW: 67, pillH: 10, pillRadius: 6, pillBorder: 0.8, pillFs: 6, pillFf: "Arial",
  pillBg: "rgb(186, 181, 164)", postPitch: 393,
};

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: W, height: 900, deviceScaleFactor: 1, isMobile: true });
  await p.goto("http://localhost:8080" + route, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  const m = await p.evaluate(() => {
    const arts = [...document.querySelectorAll("article")];
    if (arts.length < 2) return { err: "need 2 articles, got " + arts.length };
    const a = arts[0];
    const img = a.querySelector("img");
    const imgBox = img ? img.parentElement.getBoundingClientRect() : null;
    const h3 = a.querySelector("h3");
    const ps = [...a.querySelectorAll("p")].filter((e) => getComputedStyle(e).display !== "none");
    const excerpt = ps[ps.length - 1];
    const pill = a.querySelector("a");
    const cs = (e) => getComputedStyle(e);
    const r = (e) => e.getBoundingClientRect();
    return {
      artW: r(a).width,
      imageW: imgBox && imgBox.width, imageH: imgBox && imgBox.height,
      gutter: h3 ? r(h3).left - r(a).left : null,
      titleFs: cs(h3).fontSize, titleLh: cs(h3).lineHeight,
      titleOneLine: h3 ? r(h3).height < parseFloat(cs(h3).fontSize) * 2 : null,
      excerptFs: cs(excerpt).fontSize, excerptLh: cs(excerpt).lineHeight,
      excerptItalic: cs(excerpt).fontStyle === "italic",
      pillW: r(pill).width, pillH: r(pill).height,
      pillRadius: cs(pill).borderRadius, pillBorder: cs(pill).borderTopWidth,
      pillFs: cs(pill).fontSize, pillFf: cs(pill).fontFamily.split(",")[0].replace(/["']/g, ""),
      pillBg: cs(pill).backgroundColor,
      postPitch: r(arts[1]).top - r(arts[0]).top,
    };
  });
  await b.close();
  if (m.err) { console.log(m.err); return; }
  const s = 320 / m.artW; // article spans the full width on mobile
  const on = (v) => (typeof v === "number" ? +(v * s).toFixed(1) : v);
  const px = (v) => on(parseFloat(v));
  const row = (label, got, want) => {
    const ok = typeof want === "number" ? Math.abs(got - want) <= 1 : String(got) === String(want);
    console.log(`  ${label.padEnd(16)} ${String(got).padEnd(16)} RM ${String(want).padEnd(14)} ${ok ? "ok" : "<-- differs"}`);
  };
  console.log(`${route} @${W}px  (converted onto RM's 320 canvas)\n`);
  row("image w x h", `${on(m.imageW)} x ${on(m.imageH)}`, `${RM.imageW} x ${RM.imageH}`);
  row("gutter", on(m.gutter), RM.gutter);
  row("title fs/lh", `${px(m.titleFs)}/${px(m.titleLh)}`, `${RM.titleFs}/${RM.titleLh}`);
  row("title 1 line", m.titleOneLine, true);
  row("excerpt fs/lh", `${px(m.excerptFs)}/${px(m.excerptLh)}`, `${RM.excerptFs}/${RM.excerptLh}`);
  row("excerpt italic", m.excerptItalic, RM.excerptItalic);
  row("pill w x h", `${on(m.pillW)} x ${on(m.pillH)}`, `${RM.pillW} x ${RM.pillH}`);
  row("pill radius", px(m.pillRadius), RM.pillRadius);
  row("pill border", px(m.pillBorder), RM.pillBorder);
  row("pill fs", px(m.pillFs), RM.pillFs);
  row("pill font", m.pillFf, RM.pillFf);
  row("pill bg", m.pillBg, RM.pillBg);
  row("post pitch", on(m.postPitch), RM.postPitch);
})().catch((e) => { console.error(e.message); process.exit(1); });
