/**
 * Generates 60 unique SolaxyDex PNG assets under public/sprites/dex/.
 * Run: npm run generate:dex
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SPRITES = path.join(ROOT, "public/sprites");
const OUT = path.join(SPRITES, "dex");

const CLASSES = ["beast", "plant", "aquatic", "bird", "bug", "reptile", "crystal", "shadow", "mech", "ember", "void"];

/** Hand-illustrated primal lines — never overwrite with filter pipeline. */
const PRIMAL_CLASSES = new Set(["crystal", "shadow", "mech", "ember", "void"]);

/** Per-element hue anchor so breed strains feel tied to their line. */
const CLASS_HUE = {
  beast: 18,
  plant: 95,
  aquatic: 195,
  bird: 310,
  bug: 265,
  reptile: 155,
};

const BREED_COSMETICS = [
  "breed-01", "breed-02", "breed-03", "breed-04", "breed-05",
  "breed-06", "breed-07", "breed-08", "breed-09", "breed-10",
];

const DEX_STRAINS_PER_CLASS = 5;

const RARITY_PIPELINES = {
  rare: { hue: 28, saturation: 1.2, brightness: 1.05 },
  epic: { hue: 210, saturation: 1.32, brightness: 1.08 },
  legendary: { hue: 42, saturation: 1.42, brightness: 1.14 },
};

/** v1.3 — per-element hue offsets so echoes feel distinct, not copy-paste filters. */
function rarityPipelineFor(cls, stage) {
  const base = RARITY_PIPELINES[stage];
  const anchor = CLASS_HUE[cls] ?? 0;
  return {
    ...base,
    hue: base.hue + Math.round(anchor * 0.12),
    saturation: base.saturation + (anchor % 7) * 0.02,
  };
}

const STRAIN_PIPELINES = [
  { hue: 0, saturation: 1.18, brightness: 1.06, sharpen: true },
  { hue: -24, saturation: 1.22, brightness: 0.96, sharpen: false },
  { hue: 48, saturation: 1.38, brightness: 1.04, sharpen: true },
  { hue: -10, saturation: 1.28, brightness: 0.88, sharpen: false },
  { hue: 72, saturation: 1.48, brightness: 1.12, sharpen: true },
];

function strainCosmeticId(cls, strainIndex) {
  const ci = CLASSES.indexOf(cls);
  return BREED_COSMETICS[(ci * DEX_STRAINS_PER_CLASS + strainIndex) % BREED_COSMETICS.length];
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function copySprite(src, dest) {
  await sharp(src).png({ compressionLevel: 9 }).toFile(dest);
}

async function modulateSprite(srcPath, destPath, { hue = 0, saturation = 1, brightness = 1, sharpen = false }) {
  let img = sharp(srcPath).modulate({ hue, saturation, brightness });
  if (sharpen) img = img.sharpen({ sigma: 0.7 });
  await img.png({ compressionLevel: 9 }).toFile(destPath);
}

/** Breed strains: element-tinted cosmetic, sized to match class sprites. */
async function generateBreedStrain(cls, strainIndex, destPath) {
  const breedId = strainCosmeticId(cls, strainIndex);
  const cosmeticPath = path.join(SPRITES, "cosmetics", `${breedId}.png`);
  const pipeline = STRAIN_PIPELINES[strainIndex];
  const classHue = CLASS_HUE[cls];

  const classMeta = await sharp(path.join(SPRITES, `${cls}.png`)).metadata();
  const targetW = classMeta.width ?? 1024;
  const targetH = classMeta.height ?? 1024;
  const innerW = Math.round(targetW * 0.82);
  const innerH = Math.round(targetH * 0.82);

  let img = sharp(cosmeticPath)
    .resize(innerW, innerH, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: Math.floor((targetH - innerH) / 2),
      bottom: Math.ceil((targetH - innerH) / 2),
      left: Math.floor((targetW - innerW) / 2),
      right: Math.ceil((targetW - innerW) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .modulate({
      hue: classHue + pipeline.hue,
      saturation: pipeline.saturation,
      brightness: pipeline.brightness,
    });

  if (pipeline.sharpen) img = img.sharpen({ sigma: 0.6 });
  await img.png({ compressionLevel: 9 }).toFile(destPath);
}

async function main() {
  await ensureDir(OUT);
  const manifest = [];

  for (const cls of CLASSES) {
    if (PRIMAL_CLASSES.has(cls)) {
      console.log(`skip ${cls} — uses hand-illustrated dex art`);
      continue;
    }
    const baseSrc = path.join(SPRITES, `${cls}.png`);
    const baseDest = path.join(OUT, `base-${cls}.png`);
    await copySprite(baseSrc, baseDest);
    manifest.push(`base-${cls}`);

    for (const [stage, pipeline] of Object.entries(RARITY_PIPELINES)) {
      const id = `${stage}-${cls}`;
      await modulateSprite(baseSrc, path.join(OUT, `${id}.png`), rarityPipelineFor(cls, stage));
      manifest.push(id);
    }

    const cosmicSrc = path.join(SPRITES, "cosmetics", `cosmic-${cls}.png`);
    const cosmicDest = path.join(OUT, `cosmic-${cls}.png`);
    await copySprite(cosmicSrc, cosmicDest);
    manifest.push(`cosmic-${cls}`);

    for (let i = 0; i < DEX_STRAINS_PER_CLASS; i++) {
      const breedId = strainCosmeticId(cls, i);
      const id = `${cls}-${breedId}`;
      await generateBreedStrain(cls, i, path.join(OUT, `${id}.png`));
      manifest.push(id);
    }
  }

  await fs.promises.writeFile(
    path.join(OUT, "manifest.json"),
    JSON.stringify({ total: manifest.length, ids: manifest }, null, 2),
  );

  console.log(`Generated ${manifest.length} dex sprites in ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
