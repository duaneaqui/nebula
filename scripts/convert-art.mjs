import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const assets = String.raw`C:\Users\Acer Nitro Gaming\.cursor\projects\c-Users-Acer-Nitro-Gaming-Desktop-nebula-website\assets`;
const outDir = path.join(process.cwd(), "public", "art");
fs.mkdirSync(outDir, { recursive: true });

const map = {
  "hero-plaza.jpg": "hero.webp",
  "lane-ranks.jpg": "lane-ranks.webp",
  "lane-stardust.jpg": "lane-stardust.webp",
  "lane-keys.jpg": "lane-keys.webp",
  "sigil-voyager.jpg": "sigil-voyager.webp",
  "sigil-nova.jpg": "sigil-nova.webp",
  "sigil-pulsar.jpg": "sigil-pulsar.webp",
  "sigil-quasar.jpg": "sigil-quasar.webp",
  "sigil-singularity.jpg": "sigil-singularity.webp",
  "empty-cart.jpg": "empty-cart.webp",
  "order-delivered.jpg": "order-delivered.webp",
};

for (const [src, dest] of Object.entries(map)) {
  const input = path.join(assets, src);
  const output = path.join(outDir, dest);
  const info = await sharp(input).webp({ quality: 82 }).toFile(output);
  console.log(dest, info.size);
}
