// Pull the podcast cover binaries into the repo.
//
// Blog/Podcast referenced them through Lovable asset descriptors whose `url` is
// a platform path (/__l5e/assets-v1/...). That path is only served by Lovable's
// host, so on a local dev server Vite answers with index.html and every cover
// renders broken. This downloads them from the project's preview host into
// public/ so they are versioned like the other imagery.
//
// Verifies each file against the size + PNG magic recorded in the descriptor.
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src", "assets", "podcast");
const DEST = path.join(ROOT, "public", "podcast");
const HOST = "https://preview--lovably-crafted-pixels.lovable.app";

const get = (url) =>
  new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
      const type = res.headers["content-type"] || "";
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ buf: Buffer.concat(chunks), type }));
    }).on("error", reject);
  });

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".asset.json"));
  let ok = 0;
  for (const f of files) {
    const meta = JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
    const name = meta.original_filename;
    const { buf, type } = await get(HOST + meta.url);
    const isPng = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const sizeOk = buf.length === meta.size;
    if (!isPng || !sizeOk || !type.startsWith("image/")) {
      console.log(`  SKIP ${name}: png=${isPng} size=${buf.length}/${meta.size} type=${type}`);
      continue;
    }
    fs.writeFileSync(path.join(DEST, name), buf);
    console.log(`  ok   ${name}  ${buf.length} bytes`);
    ok++;
  }
  console.log(`\n${ok}/${files.length} covers written to public/podcast/`);
})().catch((e) => { console.error(e.message); process.exit(1); });
