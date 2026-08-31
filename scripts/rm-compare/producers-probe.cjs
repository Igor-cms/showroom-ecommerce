// Baseline measurement for the five Producers requests in Iteration 2 (PDF p10-11):
//   R1  island label right edge must match the surname's right edge ("Z" in BERMUDEZ)
//   R2  Diego's headshot must not fade — full opacity, just scrolls out of frame
//   R3  same for every producer; only the lines and pills may fade in
//   R4  Allan slightly bigger and a little further right when landed
//   R5  the dark overlay drifts sideways and exposes its edge near Allan
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.DEV_URL || "http://localhost:8080";
const W = parseInt(process.argv[2] || "1600", 10);
const H = parseInt(process.argv[3] || "900", 10);

const scrollTo = async (page, ticks) => {
  await page.evaluate((n) => {
    const el = document.querySelector('[style*="100vh"]') ||
      document.querySelector("div.relative.overflow-hidden");
    for (let i = 0; i < n; i++) {
      el.dispatchEvent(new WheelEvent("wheel", { deltaY: 90, bubbles: true, cancelable: true }));
    }
  }, ticks);
  await new Promise((r) => setTimeout(r, 1400));
};

const readScene = (page) => page.evaluate(() => {
  const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }; };
  const scene = document.querySelector("div.relative.overflow-hidden");
  const imgs = [...document.querySelectorAll("img[alt]")]
    .filter((i) => /BERMUDEZ|HARTMANN/i.test(i.alt));
  // The dark veil: the only inset-0 div whose background is a linear-gradient.
  const veil = [...document.querySelectorAll("div")].find((d) => {
    const c = getComputedStyle(d);
    return c.backgroundImage.includes("linear-gradient") && c.position === "absolute"
      && d.getBoundingClientRect().width > innerWidth * 0.8;
  });
  const panorama = document.querySelector('img[aria-hidden="true"]');
  return {
    scene: R(scene),
    panoramaTx: panorama && getComputedStyle(panorama).transform,
    veil: veil && { ...R(veil), transform: getComputedStyle(veil).transform },
    producers: imgs.map((i) => {
      let eff = 1;
      for (let n = i; n && n !== document.body; n = n.parentElement) {
        eff *= +getComputedStyle(n).opacity;
      }
      return { alt: i.alt, effOpacity: +eff.toFixed(3), rect: R(i) };
    }),
  };
});

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(BASE + "/producers", { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3500));

  console.log(`=== viewport ${W}x${H} ===`);
  // ~0.0662 progress per capped wheel tick at 1600 wide.
  const STOPS = [0, 8, 15, 23, 31];
  let done = 0;
  for (const t of STOPS) {
    await scrollTo(page, t - done);
    done = t;
    const s = await readScene(page);
    const prog = t * 90 / Math.max(W * 0.85, 680);
    console.log(`\n--- ${t} ticks (progress ~${Math.min(2, prog).toFixed(2)}) ---`);
    for (const p of s.producers) {
      // Effective opacity = the product down the ancestor chain, which is what
      // actually decides whether the headshot is "full seen".
      const off = p.rect.r <= 0 || p.rect.x >= 1600 * (W / 1600);
      console.log(`  ${p.alt.padEnd(16)} opacidade efetiva do retrato ${String(p.effOpacity).padEnd(6)}` +
        `  x ${String(p.rect.x).padStart(8)}..${String(p.rect.r).padStart(8)}` +
        `  ${off ? "fora de quadro" : "em quadro"}`);
    }
    if (s.veil) {
      const gapR = +(s.scene.r - s.veil.r).toFixed(1);
      const gapL = +(s.veil.x - s.scene.x).toFixed(1);
      console.log(`  veu escuro  ${s.veil.transform}  descoberto: esquerda ${gapL}px  DIREITA ${gapR}px` +
        `${gapR > 1 || gapL > 1 ? "   <<< BORDA A MOSTRA" : ""}`);
    }
  }

  // R1 — island label vs surname, for every producer and panel. Reload between
  // producers: wheel ticks only ever move progress FORWARD, so scrolling "back"
  // to Diego silently left the probe parked on Allan.
  console.log("\n=== R1: rotulo da ilha vs fim do sobrenome ===");
  // The pill reads "MY COFFEES" but the island titles that panel "COFFEES".
  const ISLAND_LABEL = { "MY STORY": "MY STORY", INTERVIEW: "INTERVIEW", "MY COFFEES": "COFFEES" };
  for (const [ticks, who] of [[0, "DIEGO"], [16, "DIANA"], [31, "ALLAN"]]) {
    await page.goto(BASE + "/producers", { waitUntil: "networkidle2", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 3000));
    if (ticks) await scrollTo(page, ticks);
    for (const pill of ["MY STORY", "INTERVIEW", "MY COFFEES"]) {
      const res = await page.evaluate(async (label, islandLabel) => {
        // Only click a pill that belongs to the VISIBLE producer's slot.
        const btns = [...document.querySelectorAll("button")].filter((b) => {
          if (!b.textContent.trim().toUpperCase().startsWith(label)) return false;
          let n = b;
          while (n && n !== document.body) {
            if (+getComputedStyle(n).opacity < 0.5) return false;
            n = n.parentElement;
          }
          return true;
        });
        if (!btns.length) return { err: "nenhuma pilula visivel" };
        btns[0].click();
        await new Promise((r) => setTimeout(r, 700));
        const aside = document.querySelector('aside[role="dialog"]');
        if (!aside) return { err: "ilha nao abriu" };
        const h3 = aside.querySelector("h3");
        const surname = h3 && h3.querySelector("span");
        const lbl = [...aside.querySelectorAll("span")]
          .find((s) => s.textContent.trim().toUpperCase() === islandLabel && s !== surname);
        if (!surname || !lbl) return { err: "sobrenome/rotulo nao encontrado" };
        const sc = aside.getBoundingClientRect().width / 549; // island design width
        const sr = surname.getBoundingClientRect().right;
        const lr = lbl.getBoundingClientRect().right;
        const title = h3.textContent.replace(/\s+/g, " ").trim();
        return { title, gapScreen: +(sr - lr).toFixed(2), gapDesign: +((sr - lr) / sc).toFixed(2), scale: +sc.toFixed(3) };
      }, pill, ISLAND_LABEL[pill]);
      if (res.err) console.log(`  ${who} / ${pill.padEnd(11)}  ${res.err}`);
      else console.log(`  ${who} / ${pill.padEnd(11)}  "${res.title}"  folga ${String(res.gapDesign).padStart(7)} px de design` +
        `${Math.abs(res.gapDesign) > 1 ? "   <<< DESALINHADO" : "   ok"}`);
      await page.evaluate(() => document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
