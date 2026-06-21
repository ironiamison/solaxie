import type { Axol, AxolClass, Rarity } from "./game";
import {
  CLASS_META,
  CLASSES,
  DEX_STRAINS_PER_CLASS,
  PRIMAL_CLASSES,
  RARITY_META,
  isDexStrainCosmetic,
  strainCosmeticId,
} from "./game";

export type DexStage = "base" | "rare" | "epic" | "legendary" | "cosmic" | "breed" | "unreleased";

export type DexLine = AxolClass | "coming-soon";

export type DexEntry = {
  id: string;
  name: string;
  stage: DexStage;
  stageLabel: string;
  /** Used for playable lines; unreleased teasers use `beast` as a harmless fallback. */
  cls: AxolClass;
  sprite: string;
  rarity: Rarity;
  howToUnlock: string;
  line: DexLine;
  order: number;
  /** Season teaser — visible in dex but not obtainable yet. */
  unreleased?: boolean;
  accentColor?: string;
};

/** Unique baked PNG for each catalog entry. */
export function dexSpritePath(id: string): string {
  return `/sprites/dex/${id}.png`;
}

function catalogSprite(cls: AxolClass, id: string): string {
  if (PRIMAL_CLASSES.includes(cls)) {
    if (id.startsWith("cosmic-")) return `/sprites/cosmetics/cosmic-${cls}.png`;
    return CLASS_META[cls].sprite;
  }
  return dexSpritePath(id);
}

const RARITY_ECHOES: { stage: DexStage; label: string; nameSuffix: string; rarity: Rarity; minStars: number }[] = [
  { stage: "rare", label: "Rare Echo", nameSuffix: "Rare", rarity: "Rare", minStars: 2 },
  { stage: "epic", label: "Epic Echo", nameSuffix: "Epic", rarity: "Epic", minStars: 3 },
  { stage: "legendary", label: "Legendary Echo", nameSuffix: "Legendary", rarity: "Legendary", minStars: 4 },
];

const BREED_STRAIN_NAMES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"];

function buildCatalog(): DexEntry[] {
  const entries: DexEntry[] = [];

  for (const cls of CLASSES) {
    const name = CLASS_META[cls].name;
    let order = 0;

    entries.push({
      id: `base-${cls}`,
      name,
      stage: "base",
      stageLabel: "Base Form",
      cls,
      sprite: catalogSprite(cls, `base-${cls}`),
      rarity: "Common",
      howToUnlock: `Roll or breed any ${name} Solaxy at the DNA Core`,
      line: cls,
      order: order++,
    });

    for (const echo of RARITY_ECHOES) {
      const echoId = `${echo.stage}-${cls}`;
      entries.push({
        id: echoId,
        name: `${echo.nameSuffix} ${name}`,
        stage: echo.stage,
        stageLabel: echo.label,
        cls,
        sprite: catalogSprite(cls, echoId),
        rarity: echo.rarity,
        howToUnlock: `Own a ${echo.rarity} or higher ${name} Solaxy`,
        line: cls,
        order: order++,
      });
    }

    entries.push({
      id: `cosmic-${cls}`,
      name: `Cosmic ${name}`,
      stage: "cosmic",
      stageLabel: "Cosmic Evolution",
      cls,
      sprite: catalogSprite(cls, `cosmic-${cls}`),
      rarity: "Cosmic",
      howToUnlock: "Pull Cosmic rarity from DNA Core or breed a Cosmic egg",
      line: cls,
      order: order++,
    });

    if (!PRIMAL_CLASSES.includes(cls)) {
      for (let i = 0; i < DEX_STRAINS_PER_CLASS; i++) {
        const breedId = strainCosmeticId(cls, i);
        const strain = BREED_STRAIN_NAMES[i];
        const strainId = `${cls}-${breedId}`;
        entries.push({
          id: strainId,
          name: `${name} Strain ${strain}`,
          stage: "breed",
          stageLabel: "Breed Mutation",
          cls,
          sprite: dexSpritePath(strainId),
          rarity: i >= 3 ? "Legendary" : i >= 1 ? "Epic" : "Rare",
          howToUnlock: `Breed two ${name} Solaxies to discover Strain ${strain}`,
          line: cls,
          order: order++,
        });
      }
    }
  }

  return entries;
}

/** Future Solaxies — teased in dex, never unlocked until a season ships them. */
const UNRELEASED_SOLAXIES: {
  id: string;
  name: string;
  codename: string;
  accentColor: string;
  rarity: Rarity;
}[] = [
  { id: "unreleased-zephyr", name: "Zephyr", codename: "Storm Solaxy", accentColor: "#ffe066", rarity: "Epic" },
  { id: "unreleased-nocturne", name: "Nocturne", codename: "Lunar Solaxy", accentColor: "#c4b5ff", rarity: "Legendary" },
  { id: "unreleased-mycelium", name: "Mycelium", codename: "Toxic Solaxy", accentColor: "#7dff6a", rarity: "Rare" },
  { id: "unreleased-solara", name: "Solara", codename: "Solar Solaxy", accentColor: "#ffd24a", rarity: "Legendary" },
  { id: "unreleased-glacier", name: "Glacier", codename: "Frost Solaxy", accentColor: "#9ae8ff", rarity: "Epic" },
  { id: "unreleased-mirage", name: "Mirage", codename: "Dream Solaxy", accentColor: "#ff9df5", rarity: "Cosmic" },
];

function buildUnreleasedCatalog(): DexEntry[] {
  return UNRELEASED_SOLAXIES.map((s, order) => ({
    id: s.id,
    name: s.name,
    stage: "unreleased" as const,
    stageLabel: "Version 1.3",
    cls: "beast" as AxolClass,
    sprite: dexSpritePath(s.id),
    rarity: s.rarity,
    howToUnlock: `${s.codename} — classified. Ships in a future season.`,
    line: "coming-soon" as const,
    order,
    unreleased: true,
    accentColor: s.accentColor,
  }));
}

const PLAYABLE_CATALOG = buildCatalog();
const UNRELEASED_CATALOG = buildUnreleasedCatalog();

export const DEX_CATALOG = [...PLAYABLE_CATALOG, ...UNRELEASED_CATALOG];

export const DEX_TOTAL = DEX_CATALOG.length;

/** Count toward player progress — excludes classified teasers. */
export const DEX_PLAYABLE_TOTAL = PLAYABLE_CATALOG.length;

export const DEX_CLASSIFIED_COUNT = UNRELEASED_CATALOG.length;

/** Classic lines have 10 forms; Primal lines ship 5 illustrated evolutions. */
export function formsForClass(cls: (typeof CLASSES)[number]): number {
  return PRIMAL_CLASSES.includes(cls) ? 5 : 10;
}

/** Which catalog entries the player has ever owned. */
export function unlockedDexIds(axols: Axol[]): Set<string> {
  const out = new Set<string>();
  for (const a of axols) {
    const cls = a.cls;
    const stars = RARITY_META[a.rarity].stars;

    out.add(`base-${cls}`);
    if (stars >= 2) out.add(`rare-${cls}`);
    if (stars >= 3) out.add(`epic-${cls}`);
    if (stars >= 4) out.add(`legendary-${cls}`);
    if (a.rarity === "Cosmic" || a.cosmeticId === `cosmic-${cls}`) {
      out.add(`cosmic-${cls}`);
    }
    if (a.cosmeticId && isDexStrainCosmetic(cls, a.cosmeticId)) {
      out.add(`${cls}-${a.cosmeticId}`);
    }
  }
  return out;
}

export function dexProgress(axols: Axol[]): { unlocked: number; total: number; classified: number } {
  const ids = unlockedDexIds(axols);
  return { unlocked: ids.size, total: DEX_PLAYABLE_TOTAL, classified: DEX_CLASSIFIED_COUNT };
}

export function dexUnreleasedEntries(): DexEntry[] {
  return UNRELEASED_CATALOG;
}

export function dexEntriesForLine(line: AxolClass): DexEntry[] {
  return DEX_CATALOG.filter((e) => e.line === line).sort((a, b) => a.order - b.order);
}

export function dexBreedEntries(): DexEntry[] {
  return DEX_CATALOG.filter((e) => e.stage === "breed");
}
