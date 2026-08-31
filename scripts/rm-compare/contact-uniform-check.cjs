// Proof that /contact is UNIFORMLY scaled: resolve the real `--u` at each
// viewport (by measuring an element 1000*--u wide), then express every measure
// in canvas px. A uniform scale means those numbers are identical everywhere,
// and equal to the values read off the live Readymag canvas.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.DEV_URL || "http://localhost:8080";
const SIZES = [[1280, 800], [1280, 720], [1366, 768], [1440, 900], [1440, 780],
                [1600, 900], [1920, 1080], [1920, 940], [2560, 1440], [3840, 2160]];
// Values read off the live RM canvas (my.readymag.com preview/6, K=1.0).
const RM = { pill: 22.5, titleFs: 60, name: 312.8, pitch: 17, ta: 192, submit: 8, fieldW: 507 };

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  const rows = [];
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(BASE + "/contact", { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    const m = await page.evaluate(() => {
      // Resolve --u to high precision.
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;width:calc(1000*var(--u))";
      const host = document.querySelector("main").parentElement;
      host.appendChild(probe);
      const u = probe.getBoundingClientRect().width / 1000;
      probe.remove();

      const vis = (e) => {
        const r = e.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        for (let n = e; n && n !== document.body; n = n.parentElement) {
          const c = getComputedStyle(n);
          if (c.display === "none" || c.visibility === "hidden" || +c.opacity < 0.05) return false;
        }
        return true;
      };
      const all = [...document.querySelectorAll("main *")].filter(vis);
      const leaf = (re) => all.find((e) => e.children.length === 0 && re.test((e.textContent || "").trim()));
      const pill = leaf(/WHOLESALE INQUIRIES/i);
      const title = leaf(/^contact$/i);
      // Match on the label, not on type="submit": the customer-login feature
      // put a "Login" submit button earlier in <main>, and selecting the first
      // one silently measured that instead (a fixed 22px, so it read as drift).
      const btn = [...document.querySelectorAll("main button")]
        .find((e) => (e.textContent || "").trim().toLowerCase() === "submit");
      const fields = [...document.querySelectorAll("main input,main textarea,main select")].filter(vis)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const ta = fields.find((e) => e.tagName === "TEXTAREA");
      const header = document.querySelector("header").getBoundingClientRect();
      return {
        u,
        pillH: pill && pill.getBoundingClientRect().height,
        titleFs: title && parseFloat(getComputedStyle(title).fontSize),
        fieldW: fields[0] && fields[0].getBoundingClientRect().width,
        // first field measured from the header rule, like the RM canvas origin
        nameY: fields[0] && (fields[0].getBoundingClientRect().top - header.bottom),
        pitch: fields[1] && (fields[1].getBoundingClientRect().top - fields[0].getBoundingClientRect().top),
        taH: ta && ta.getBoundingClientRect().height,
        submitH: btn && btn.getBoundingClientRect().height,
        rightGap: fields[0] && (innerWidth - fields[0].getBoundingClientRect().right),
        // The scaled block itself — this is what BLOCK_H in Contact.tsx must equal.
        blockH: document.querySelector("main > div.grid").getBoundingClientRect().height,
        doc: document.documentElement.scrollHeight, vh: innerHeight,
        overX: document.documentElement.scrollWidth - innerWidth,
      };
    });
    const u = m.u;
    const c = (v) => (v == null ? null : +(v / u).toFixed(2));
    rows.push({
      vp: `${w}x${h}`, u: +u.toFixed(4), bound: Math.abs(u - w / 1024) < 0.002 ? "largura" : "altura",
      pill: c(m.pillH), title: c(m.titleFs), fieldW: c(m.fieldW), pitch: c(m.pitch),
      ta: c(m.taH), submit: c(m.submitH), pr: c(m.rightGap), bloco: c(m.blockH),
      rola: m.doc - m.vh > 2 ? `${m.doc - m.vh}px` : "nao", overX: m.overX,
    });
  }
  const cols = ["vp", "u", "bound", "pill", "title", "fieldW", "pitch", "ta", "submit", "pr", "bloco", "rola", "overX"];
  const wdt = cols.map((k) => Math.max(k.length, ...rows.map((r) => String(r[k]).length)));
  console.log("\n--- tudo em canvas-px (1024), resolvido pelo --u real ---");
  console.log(cols.map((k, i) => k.padStart(wdt[i])).join("  "));
  rows.forEach((r) => console.log(cols.map((k, i) => String(r[k]).padStart(wdt[i])).join("  ")));
  console.log(`\nRM ao vivo: pill ${RM.pill}  title ${RM.titleFs}  fieldW ${RM.fieldW}  pitch ${RM.pitch}  ta ${RM.ta}  submit ${RM.submit}  pr 15`);
  const base = rows[0];
  const drift = ["pill", "title", "fieldW", "pitch", "ta", "submit", "pr"]
    .map((k) => ({ k, d: Math.max(...rows.map((r) => Math.abs(r[k] - base[k]))) }))
    .filter((x) => x.d > 0.25);
  console.log(drift.length
    ? "DERIVA entre viewports: " + drift.map((x) => `${x.k} ${x.d.toFixed(2)}`).join(", ")
    : "escala uniforme confirmada: nenhuma medida varia mais que 0.25 canvas-px entre viewports");
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
