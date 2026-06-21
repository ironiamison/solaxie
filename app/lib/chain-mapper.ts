import type { Axol as ChainAxol } from "@/utils/anchor";
import {
  CLASS_SLUG,
  battleStats,
  deriveStats,
  primaryClass,
  rarity as chainRarity,
} from "@/utils/anchor";
import type { Axol, AxolClass, Genes, Rarity } from "./game";
import { GENE_POOL, MAX_BREED_COUNT, NAME_PREFIX } from "./game";

const PART_KEYS: (keyof Genes)[] = ["eyes", "ears", "mouth", "horn", "back", "tail"];

function genomeToGenes(genome: number[][]): Genes {
  const out = {} as Genes;
  PART_KEYS.forEach((key, i) => {
    const pool = GENE_POOL[key];
    const idx = (genome[i]?.[0] ?? 0) % pool.length;
    out[key] = pool[idx];
  });
  return out;
}

function chainClassToUi(clsIndex: number): AxolClass {
  return CLASS_SLUG[clsIndex % CLASS_SLUG.length] as AxolClass;
}

function chainRarityToUi(tier: string): Rarity {
  if (tier === "Legendary") return "Legendary";
  if (tier === "Epic") return "Epic";
  if (tier === "Rare") return "Rare";
  if (tier === "Uncommon") return "Rare";
  return "Common";
}

/** Map an on-chain Axol PDA account to the UI creature type. */
export function chainAxolToUi(a: ChainAxol): Axol {
  const genome = a.genome.map((part) => [...part] as [number, number, number]);
  const cls = chainClassToUi(primaryClass(genome));
  const r = chainRarity(genome);
  const bs = battleStats(genome);
  const ds = deriveStats(genome);
  const id = Number(a.id);
  const parentA = Number(a.parentA);
  const parentB = Number(a.parentB);
  const noParent = (n: number) => n >= 9007199254740991; // u64::MAX or unset

  return {
    id,
    name: NAME_PREFIX[id % NAME_PREFIX.length],
    cls,
    rarity: chainRarityToUi(r.tier),
    level: a.level,
    generation: a.generation,
    breedCount: a.breedCount,
    maxBreedCount: MAX_BREED_COUNT,
    hp: bs.hp,
    attack: bs.atk,
    defense: bs.def,
    speed: bs.spd,
    skill: ds.skill,
    morale: ds.morale,
    genes: genomeToGenes(genome),
    xp: Number(a.xp),
    status: "idle",
    parents: !noParent(parentA) && !noParent(parentB) ? [parentA, parentB] : undefined,
  };
}
