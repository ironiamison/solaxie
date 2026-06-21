/**
 * Strip near-black pixels to transparency for game sprites.
 * Usage: node scripts/remove-black-bg.mjs <input.png> [output.png]
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const DARK_THRESHOLD = 42;
const LIGHT_THRESHOLD = 248;

async function removeBlackBg(input, output) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);
  const w = info.width;
  const h = info.height;

  const isBg = (r, g, b) => {
    if (r <= DARK_THRESHOLD && g <= DARK_THRESHOLD && b <= DARK_THRESHOLD) return true;
    if (r >= LIGHT_THRESHOLD && g >= LIGHT_THRESHOLD && b >= LIGHT_THRESHOLD) return true;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min <= 8 && max >= 220) return true;
    return false;
  };

  // Flood-fill from edges so we don't eat light fur highlights inside the creature.
  const visited = new Uint8Array(w * h);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (!isBg(pixels[i], pixels[i + 1], pixels[i + 2])) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (queue.length) {
    const idx = queue.pop();
    const x = idx % w;
    const y = (idx - x) / w;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  for (let idx = 0; idx < w * h; idx++) {
    if (visited[idx]) pixels[idx * 4 + 3] = 0;
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(output);

  const meta = await sharp(output).metadata();
  console.log(`OK ${path.basename(output)} — ${meta.width}x${meta.height} alpha=${meta.hasAlpha}`);
}

const input = process.argv[2];
const output = process.argv[3] ?? input;

if (!input) {
  console.error("Usage: node scripts/remove-black-bg.mjs <input> [output]");
  process.exit(1);
}

removeBlackBg(input, output).catch((err) => {
  console.error(err);
  process.exit(1);
});
