// One-off asset optimizer for the /producers scene.
// Converts the oversized panorama + portrait PNGs to WebP, resized to the
// resolution they are actually displayed at (with retina headroom), preserving
// alpha, framing and visual quality. Run with: node scripts/optimize-producers.js
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "public", "producers");

const jobs = [
  // Panorama: shown near-native width across the pan. No alpha. Keep full width.
  { src: "background-mist.jpg", dst: "background-mist.webp", maxH: null, quality: 80 },
  // Portraits: alpha cutouts. Displayed at ~680–920px height; cap at 2200px so
  // even a 2x retina, upscaled stage stays crisp while cutting 4MB → a fraction.
  { src: "diego-rm.png", dst: "diego-rm.webp", maxH: 2200, quality: 84 },
  { src: "diana-rm.png", dst: "diana-rm.webp", maxH: 2200, quality: 84 },
];

(async () => {
  for (const j of jobs) {
    const srcPath = path.join(dir, j.src);
    const dstPath = path.join(dir, j.dst);
    let img = sharp(srcPath);
    const meta = await img.metadata();
    if (j.maxH && meta.height > j.maxH) {
      img = img.resize({ height: j.maxH, withoutEnlargement: true });
    }
    await img.webp({ quality: j.quality, effort: 6, alphaQuality: 100 }).toFile(dstPath);
    const before = fs.statSync(srcPath).size;
    const after = fs.statSync(dstPath).size;
    const out = await sharp(dstPath).metadata();
    console.log(
      `${j.src} (${meta.width}x${meta.height}, ${(before / 1024 / 1024).toFixed(2)}MB)` +
        ` -> ${j.dst} (${out.width}x${out.height}, ${(after / 1024).toFixed(0)}KB)` +
        `  saved ${(100 - (after / before) * 100).toFixed(0)}%`
    );
  }
})();
