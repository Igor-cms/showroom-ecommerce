// Audit Diego's coffees using the LIVE data the running app fetches. Capture
// the Shopify GraphQL response body, then derive each product's `producer` the
// same way the app does (parse "Producer:" from the description) and report
// which products match Diego.
const fs = require("fs");
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const normalize = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const htmlToText = (h) =>
  (h || "").replace(/<\s*br\s*\/?\s*>/gi, "\n").replace(/<\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&");
const ALL = ["Origin", "Producer", "Estate", "Region", "Varietal", "Altitude", "Process", "Roast", "Sensory", "Tasting Notes", "Notes"];
function extractLabeled(text, label) {
  const m = new RegExp(`${label}\\s*:`, "i").exec(text);
  if (!m) return null;
  const start = m.index + m[0].length; let end = text.length;
  for (const o of ALL) { const n = new RegExp(`${o}\\s*:`, "i").exec(text.slice(start)); if (n) end = Math.min(end, start + n.index); }
  return text.slice(start, end).replace(/\s+/g, " ").replace(/^[\s,;·\-–]+|[\s,;·\-–]+$/g, "").trim() || null;
}

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  let captured = null;
  p.on("response", async (res) => {
    if (!res.url().includes("graphql.json")) return;
    try {
      const body = await res.text();
      const json = JSON.parse(body);
      if (json?.data?.products?.edges) captured = json.data.products.edges;
    } catch (e) {}
  });
  await p.goto("http://localhost:8080/shop", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  await b.close();

  if (!captured) { console.log("No products captured."); return; }
  console.log(`Total products: ${captured.length}\n=== title | derived producer | Diego? ===`);
  const diego = [];
  for (const e of captured) {
    const n = e.node;
    const producer = extractLabeled(htmlToText(n.descriptionHtml || ""), "Producer");
    const match = producer && normalize(producer).includes("BERMUDEZ");
    if (match) diego.push({ title: n.title, producer });
    console.log(`${match ? "DIEGO" : "  -  "} | ${n.title}  |  producer=${producer === null ? "(none)" : `"${producer}"`}`);
  }
  console.log(`\n=== ${diego.length} shown under DIEGO ===`);
  diego.forEach((d) => console.log(`   • ${d.title}  →  "${d.producer}"`));
})().catch((e) => { console.error(e.message); process.exit(1); });
