// ---------------------------------------------------------------------------
// Solaxie — local "fake world" game logic (24h MVP).
// Everything here is in-memory placeholder state. Blockchain calls are stubbed
// in `chain` below; swap those bodies for real Anchor calls later.
//
// Core systems (kept intentionally simple & easy to tweak):
//   - 6 elemental classes with two advantage triangles
//   - 5 rarities, separate from class, that multiply stats
//   - stat generation from class + rarity
//   - battle score with a 15% class-advantage bonus
// ---------------------------------------------------------------------------

export type AxolClass =
  | "beast"
  | "plant"
  | "aquatic"
  | "bird"
  | "bug"
  | "reptile"
  | "crystal"
  | "shadow"
  | "mech"
  | "ember"
  | "void";

export const CLASSES: AxolClass[] = [
  "beast", "plant", "aquatic", "bird", "bug", "reptile",
  "crystal", "shadow", "mech", "ember", "void",
];

/** New Primal elements — full illustrated evolution line (no filter breed strains yet). */
export const PRIMAL_CLASSES: AxolClass[] = ["crystal", "shadow", "mech", "ember", "void"];

// Class advantage — three triangles.
//   Triangle 1: Beast > Plant > Aquatic > Beast
//   Triangle 2: Bird  > Bug   > Reptile > Bird
//   Triangle 3: Crystal > Mech > Ember > Crystal
//   Shadow > Void, Void > Crystal
const BEATS: Record<AxolClass, AxolClass> = {
  beast: "plant",
  plant: "aquatic",
  aquatic: "beast",
  bird: "bug",
  bug: "reptile",
  reptile: "bird",
  crystal: "mech",
  mech: "ember",
  ember: "crystal",
  shadow: "void",
  void: "crystal",
};

export const CLASS_META: Record<
  AxolClass,
  { name: string; color: string; sprite: string; beats: AxolClass; identity: string }
> = {
  beast: { name: "Beast", color: "#ffa83d", sprite: "/sprites/beast.png", beats: BEATS.beast, identity: "High-attack bruiser" },
  plant: { name: "Plant", color: "#54e07a", sprite: "/sprites/plant.png", beats: BEATS.plant, identity: "High HP / sustain tank" },
  aquatic: { name: "Aquatic", color: "#3db4ff", sprite: "/sprites/aquatic.png", beats: BEATS.aquatic, identity: "Fast balanced fighter" },
  bird: { name: "Bird", color: "#ff5fb0", sprite: "/sprites/bird.png", beats: BEATS.bird, identity: "High speed / crit assassin" },
  bug: { name: "Bug", color: "#a779ff", sprite: "/sprites/bug.png", beats: BEATS.bug, identity: "Debuff / trickster" },
  reptile: { name: "Reptile", color: "#2fe0cf", sprite: "/sprites/reptile.png", beats: BEATS.reptile, identity: "Defense / counterattack defender" },
  crystal: { name: "Crystal", color: "#7ecbff", sprite: "/sprites/crystal.png", beats: BEATS.crystal, identity: "Armored glass cannon" },
  shadow: { name: "Shadow", color: "#7a5cff", sprite: "/sprites/shadow.png", beats: BEATS.shadow, identity: "Stealth / debuff striker" },
  mech: { name: "Mech", color: "#5ce0ff", sprite: "/sprites/mech.png", beats: BEATS.mech, identity: "Precision tech fighter" },
  ember: { name: "Ember", color: "#ff6b3d", sprite: "/sprites/ember.png", beats: BEATS.ember, identity: "Burst damage pyro" },
  void: { name: "Void", color: "#b06bff", sprite: "/sprites/void.png", beats: BEATS.void, identity: "Cosmic finisher" },
};

export type Advantage = "advantage" | "disadvantage" | "neutral";

/** Does `attacker` have a class advantage over `defender`? */
export function getClassAdvantage(attacker: AxolClass, defender: AxolClass): Advantage {
  if (BEATS[attacker] === defender) return "advantage";
  if (BEATS[defender] === attacker) return "disadvantage";
  return "neutral";
}

// ---- Rarity (separate from class) -----------------------------------------

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Cosmic";

export const RARITY_META: Record<Rarity, { stars: number; color: string; mult: number; odds: number }> = {
  Common: { stars: 1, color: "#9aa4b2", mult: 1.0, odds: 60 },
  Rare: { stars: 2, color: "#3db4ff", mult: 1.1, odds: 25 },
  Epic: { stars: 3, color: "#a779ff", mult: 1.25, odds: 10 },
  Legendary: { stars: 4, color: "#ffb02e", mult: 1.45, odds: 4 },
  Cosmic: { stars: 5, color: "#c46bff", mult: 1.75, odds: 1 },
};

// Rarest-first (used for display); roll walks commonest-first.
export const RARITY_ORDER: Rarity[] = ["Cosmic", "Legendary", "Epic", "Rare", "Common"];

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Weighted rarity roll. `luck` (0..1) nudges the result toward rarer tiers. */
export function getRarityRoll(luck = 0): Rarity {
  const roll = Math.min(99.999, Math.random() * 100 - Math.min(40, luck * 40));
  let cum = 0;
  for (const tier of [...RARITY_ORDER].reverse()) {
    // common -> ... -> cosmic
    cum += RARITY_META[tier].odds;
    if (roll <= cum) return tier;
  }
  return "Cosmic";
}

// ---- Stats & genes --------------------------------------------------------

export type Stats = { hp: number; attack: number; defense: number; speed: number; skill: number; morale: number };

const BASE_STATS: Stats = { hp: 60, attack: 45, defense: 45, speed: 45, skill: 40, morale: 40 };

// Per-class flavor bonuses (added before the rarity multiplier).
const CLASS_BONUS: Record<AxolClass, Partial<Stats>> = {
  beast: { attack: 30 },
  plant: { hp: 40 },
  aquatic: { speed: 22, attack: 8 },
  bird: { speed: 24, skill: 16 },
  bug: { skill: 22, morale: 22 },
  reptile: { defense: 28, hp: 22 },
  crystal: { defense: 18, skill: 18 },
  shadow: { skill: 26, speed: 14 },
  mech: { attack: 16, skill: 20 },
  ember: { attack: 26, morale: 12 },
  void: { skill: 24, attack: 14 },
};

/** Generate stats from class + rarity (rarity multiplies everything). */
export function generateStats(cls: AxolClass, rarity: Rarity): Stats {
  const mult = RARITY_META[rarity].mult;
  const base: Stats = { ...BASE_STATS };
  const bonus = CLASS_BONUS[cls];
  (Object.keys(bonus) as (keyof Stats)[]).forEach((k) => {
    base[k] += bonus[k] as number;
  });
  const roll = (n: number) => Math.round((n + rng(-6, 6)) * mult);
  return {
    hp: roll(base.hp),
    attack: roll(base.attack),
    defense: roll(base.defense),
    speed: roll(base.speed),
    skill: roll(base.skill),
    morale: roll(base.morale),
  };
}

export type Genes = { eyes: string; ears: string; mouth: string; horn: string; back: string; tail: string };

export const GENE_POOL: Record<keyof Genes, string[]> = {
  eyes: ["Round", "Sleepy", "Sharp", "Starry", "Wide"],
  ears: ["Perky", "Floppy", "Tufted", "Frilled", "Tiny"],
  mouth: ["Smile", "Fang", "Beak", "Pout", "Grin"],
  horn: ["None", "Nub", "Curved", "Crystal", "Twin"],
  back: ["Smooth", "Spiked", "Finned", "Mossy", "Shell"],
  tail: ["Short", "Long", "Fan", "Curl", "Forked"],
};

function randomGenes(): Genes {
  return {
    eyes: pick(GENE_POOL.eyes),
    ears: pick(GENE_POOL.ears),
    mouth: pick(GENE_POOL.mouth),
    horn: pick(GENE_POOL.horn),
    back: pick(GENE_POOL.back),
    tail: pick(GENE_POOL.tail),
  };
}

function mixGenes(a: Genes, b: Genes): Genes {
  const out = {} as Genes;
  (Object.keys(GENE_POOL) as (keyof Genes)[]).forEach((part) => {
    // 10% mutation, otherwise inherit from a random parent.
    out[part] = Math.random() < 0.1 ? pick(GENE_POOL[part]) : Math.random() < 0.5 ? a[part] : b[part];
  });
  return out;
}

// ---- Axol -----------------------------------------------------------------

export const MAX_BREED_COUNT = 7;

export type Axol = {
  id: number;
  name: string;
  cls: AxolClass;
  rarity: Rarity;
  level: number;
  generation: number;
  breedCount: number;
  maxBreedCount: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  skill: number;
  morale: number;
  genes: Genes;
  xp: number;
  status: string;
  parents?: [number, number];
  /** Assigned on breed (or rare roll) — maps to `/sprites/cosmetics/*.png` */
  cosmeticId?: string;
};

export type Resources = {
  solax: number;
  dna: number;
  eggs: number;
  energy: number;
  maxEnergy: number;
  streak: number;
};

export const COSTS = {
  roll: { solax: 100_000, dna: 0, energy: 0 },
  breed: { solax: 150_000, eggs: 0 },
  battle: { energy: 10 },
};

/** On-chain program costs (6-decimal SPL base units → whole tokens). */
export const ON_CHAIN_COSTS = {
  mintAxol: 100_000,
  breedBase: 150_000,
  battleEnergy: 10,
  breedEnergy: 10,
  starterGrant: 0,
};

// Energy refill pricing: 100k SOLAX per 10 energy → 1,000,000 for a full 100 bar.
// Energy refill pricing: 100k SOLAX per 10 energy → 1,000,000 for a full 100 bar.
export const ENERGY_REFILL = { perBlock: 10, solaxPerBlock: 100_000 };

/** SOLAX cost to refill `energy` points (priced per 10-energy block). */
export function energyRefillCost(energy: number): number {
  return Math.ceil(energy / ENERGY_REFILL.perBlock) * ENERGY_REFILL.solaxPerBlock;
}

/** Free DNA claim in the DNA Core sidebar. */
export const DNA_BONUS = { amount: 5, cooldownMs: 4 * 60 * 60 * 1000 };

export function dnaBonusRemaining(lastClaimAt: number | undefined, now = Date.now()): number {
  if (!lastClaimAt) return 0;
  return Math.max(0, DNA_BONUS.cooldownMs - (now - lastClaimAt));
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return "";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export const STARTING_RESOURCES: Resources = {
  solax: 0,
  dna: 34,
  eggs: 3,
  energy: 100,
  maxEnergy: 100,
  streak: 12,
};

const STATUSES = ["Sleeping", "Playing", "Fishing", "Splashing", "Napping", "Exploring"];
export const NAME_PREFIX = ["Blaze", "Coral", "Sprout", "Pip", "Zappy", "Mossy", "Bubbles", "Echo", "Nimbus", "Fern", "Spark", "Pebble", "Dewey", "Tonka", "Yuzu"];

let idCounter = 1;
export function nextId() {
  return idCounter++;
}
/** Keep the counter ahead of any seeded ids. */
export function primeIds(seed: Axol[]) {
  if (seed.length === 0) return;
  idCounter = Math.max(idCounter, ...seed.map((a) => a.id + 1));
}
export function setIdCounter(n: number) {
  idCounter = Math.max(1, n);
}
export function getIdCounter() {
  return idCounter;
}

/** Build a random Axol. Any field can be overridden via `opts`. */
export function generateRandomAxol(opts: Partial<Axol> = {}): Axol {
  const cls = opts.cls ?? pick(CLASSES);
  const rarity = opts.rarity ?? getRarityRoll();
  const s = generateStats(cls, rarity);
  return {
    id: opts.id ?? nextId(),
    name: opts.name ?? pick(NAME_PREFIX),
    cls,
    rarity,
    level: opts.level ?? 1,
    generation: opts.generation ?? 0,
    breedCount: opts.breedCount ?? 0,
    maxBreedCount: opts.maxBreedCount ?? MAX_BREED_COUNT,
    hp: opts.hp ?? s.hp,
    attack: opts.attack ?? s.attack,
    defense: opts.defense ?? s.defense,
    speed: opts.speed ?? s.speed,
    skill: opts.skill ?? s.skill,
    morale: opts.morale ?? s.morale,
    genes: opts.genes ?? randomGenes(),
    xp: opts.xp ?? 0,
    status: opts.status ?? pick(STATUSES),
    parents: opts.parents,
    cosmeticId:
      opts.cosmeticId ??
      (rarity === "Cosmic"
        ? `cosmic-${cls}`
        : rarity === "Legendary" || rarity === "Epic"
        ? pickBreedCosmetic(cls, rarity)
        : undefined),
  };
}

// Backwards-compatible aliases used around the app.
export const randomAxol = generateRandomAxol;
export const rollRarity = getRarityRoll;

/** A wild opponent scaled near the player's fighter. */
export function wildAxol(reference?: Axol): Axol {
  const a = generateRandomAxol();
  if (reference) {
    const scale = 0.85 + Math.random() * 0.4;
    a.hp = Math.round(reference.hp * scale);
    a.attack = Math.round(reference.attack * scale);
    a.defense = Math.round(reference.defense * scale);
    a.speed = Math.round(reference.speed * scale);
    a.skill = Math.round(reference.skill * scale);
    a.morale = Math.round(reference.morale * scale);
    a.level = Math.max(1, reference.level + rng(-1, 1));
  }
  a.name = `Wild ${CLASS_META[a.cls].name}`;
  return a;
}

export function canBreed(a: Axol): boolean {
  return a.breedCount < a.maxBreedCount;
}

export function breedAxol(a: Axol, b: Axol): Axol {
  // 15% chance the child mutates to a brand-new random class.
  const cls = Math.random() < 0.15 ? pick(CLASSES) : pick([a.cls, b.cls]);
  const generation = Math.max(a.generation, b.generation) + 1;

  // Rarity tends upward with a chance to crit up a tier.
  const parentBest = Math.max(RARITY_META[a.rarity].stars, RARITY_META[b.rarity].stars);
  const stars = Math.min(5, parentBest + (Math.random() < 0.25 ? 1 : 0));
  const rarity = (Object.keys(RARITY_META) as Rarity[]).find((r) => RARITY_META[r].stars === stars) ?? "Common";

  const avg = (k: keyof Stats) => Math.round(((a[k] + b[k]) / 2) * (1 + generation * 0.04));
  const cosmeticId = pickBreedCosmetic(cls, rarity);
  return {
    id: nextId(),
    name: pick(NAME_PREFIX),
    cls,
    rarity,
    level: 1,
    generation,
    breedCount: 0,
    maxBreedCount: MAX_BREED_COUNT,
    hp: avg("hp"),
    attack: avg("attack"),
    defense: avg("defense"),
    speed: avg("speed"),
    skill: avg("skill"),
    morale: avg("morale"),
    genes: mixGenes(a.genes, b.genes),
    xp: 0,
    status: "Hatched",
    parents: [a.id, b.id],
    cosmeticId,
  };
}

// ---- Breeding preview (UI flavor, stable per parent pair) ------------------

/** Genetic harmony 0-100 between two parents — drives the "Compatibility" %. */
export function breedCompatibility(a: Axol, b: Axol): number {
  let c = 80;
  c -= Math.abs(RARITY_META[a.rarity].stars - RARITY_META[b.rarity].stars) * 5;
  if (a.cls === b.cls) c += 8;
  else if (getClassAdvantage(a.cls, b.cls) !== "neutral") c += 3;
  c -= Math.abs(a.generation - b.generation) * 2;
  c += ((a.id * 7 + b.id * 13) % 11) - 5; // deterministic jitter
  return Math.max(60, Math.min(98, Math.round(c)));
}

/** The element(s) the offspring could inherit (parents + one mutation slot). */
export function possibleElements(a: Axol, b: Axol): AxolClass[] {
  const out: AxolClass[] = [];
  [a.cls, b.cls].forEach((c) => { if (!out.includes(c)) out.push(c); });
  let i = (a.id + b.id) % CLASSES.length;
  while (out.length < 3) {
    const c = CLASSES[i % CLASSES.length];
    if (!out.includes(c)) out.push(c);
    i++;
  }
  return out;
}

/** Mutation / Epic / Cosmic odds for the offspring (display percentages). */
export function breedChances(a: Axol, b: Axol): { mutation: number; epic: number; cosmic: number } {
  const seed = a.id * 7 + b.id * 5;
  const bestStars = Math.max(RARITY_META[a.rarity].stars, RARITY_META[b.rarity].stars);
  return {
    mutation: 10 + (seed % 9),
    epic: 2 + ((a.id * 3 + b.id * 11) % 9) + Math.max(0, bestStars - 2),
    cosmic: Math.round((0.3 + ((a.id + b.id) % 7) * 0.1) * 10) / 10,
  };
}

// ---- Battle ----------------------------------------------------------------

/** A single Axol's raw combat value (before class advantage). */
export function power(a: Axol): number {
  return a.hp * 0.22 + a.attack * 0.5 + a.defense * 0.25 + a.speed * 0.3 + a.skill * 0.2 + a.morale * 0.12;
}

const ADVANTAGE_BONUS = 1.15;

/** Battle score for `axol` vs `opponent`, applying the 15% advantage bonus. */
export function calculateBattleScore(axol: Axol, opponent: Axol): number {
  const adv = getClassAdvantage(axol.cls, opponent.cls);
  const mult = adv === "advantage" ? ADVANTAGE_BONUS : 1;
  return power(axol) * mult;
}

export type BattleResult = {
  win: boolean;
  myRoll: number;
  enemyRoll: number;
  advantage: "you" | "enemy" | "none";
  rewardXp: number;
};

export function resolveBattle(mine: Axol, enemy: Axol): BattleResult {
  const variance = () => 0.85 + Math.random() * 0.3;
  const myRoll = Math.round(calculateBattleScore(mine, enemy) * variance());
  const enemyRoll = Math.round(calculateBattleScore(enemy, mine) * variance());
  const win = myRoll >= enemyRoll;

  let advantage: BattleResult["advantage"] = "none";
  if (getClassAdvantage(mine.cls, enemy.cls) === "advantage") advantage = "you";
  else if (getClassAdvantage(enemy.cls, mine.cls) === "advantage") advantage = "enemy";

  return {
    win,
    myRoll,
    enemyRoll,
    advantage,
    rewardXp: win ? 40 : 15,
  };
}

// ---- Battle replay (scripted turn-by-turn presentation) -------------------
// `resolveBattle` decides the winner; this turns that outcome into a juicy,
// readable sequence of attacks with damage numbers and HP that always ends on
// the correct victor. Pure presentation — no game state is changed here.

export type ReplayEvent = {
  kind: "advantage" | "item" | "attack" | "win";
  side: "mine" | "enemy"; // who acts / who is highlighted
  cls?: AxolClass; // attacker class (drives the attack VFX)
  text: string;
  sub?: string; // "Critical hit!" / "Bird is stunned!"
  dmg?: number;
  crit?: boolean;
  eff?: boolean; // super effective (attacker has class advantage)
  mineHp: number; // HP remaining AFTER this event
  enemyHp: number;
};

export type Replay = { events: ReplayEvent[]; win: boolean; mineMax: number; enemyMax: number };

const ITEM_FLAVOR: Record<string, string> = {
  rage: "Rage Potion ignites — attack surges!",
  shield: "Crystal Shield raised — defense up!",
  orb: "Lightning Orb crackles — speed up!",
  clover: "Lucky Clover shimmers — crit chance up!",
};

// Split a total into `parts` positive chunks (>= floor each) that sum exactly.
function splitDamage(total: number, parts: number, floor = 6): number[] {
  if (parts <= 0) return [];
  const out: number[] = [];
  let remaining = total;
  for (let i = 0; i < parts - 1; i++) {
    const avg = remaining / (parts - i);
    const room = remaining - (parts - i - 1) * floor;
    const v = Math.max(floor, Math.min(room, Math.round(avg * (0.7 + Math.random() * 0.6))));
    out.push(v);
    remaining -= v;
  }
  out.push(Math.max(floor, remaining));
  return out;
}

export function buildReplay(mine: Axol, enemy: Axol, win: boolean, items: string[] = []): Replay {
  const mineMax = Math.round(mine.hp * 1.5 + 90);
  const enemyMax = Math.round(enemy.hp * 1.5 + 90);
  let mineHp = mineMax;
  let enemyHp = enemyMax;
  const events: ReplayEvent[] = [];

  const nameMine = CLASS_META[mine.cls].name;
  const nameEnemy = CLASS_META[enemy.cls].name;

  const adv = getClassAdvantage(mine.cls, enemy.cls);
  if (adv === "advantage")
    events.push({ kind: "advantage", side: "mine", text: `Type advantage — ${nameMine} presses the attack!`, mineHp, enemyHp });
  else if (adv === "disadvantage")
    events.push({ kind: "advantage", side: "enemy", text: `${nameEnemy} holds the type edge!`, mineHp, enemyHp });

  items.forEach((it) => {
    if (ITEM_FLAVOR[it]) events.push({ kind: "item", side: "mine", text: ITEM_FLAVOR[it], mineHp, enemyHp });
  });

  const winnerIsMine = win;
  const rounds = rng(3, 5);
  const winnerPool = winnerIsMine ? mineMax : enemyMax;
  const loserPool = winnerIsMine ? enemyMax : mineMax;

  const winnerDmgs = splitDamage(loserPool, rounds); // exactly KOs the loser
  const loserDmgs = splitDamage(Math.round(winnerPool * (0.4 + Math.random() * 0.25)), rounds - 1);

  const mineFaster = mine.speed >= enemy.speed;
  const winnerFaster = winnerIsMine ? mineFaster : !mineFaster;
  const cloverLuck = items.includes("clover") ? 0.18 : 0;
  const mineEff = adv === "advantage";
  const enemyEff = adv === "disadvantage";

  const attack = (attacker: "mine" | "enemy", dmg: number, isFinal: boolean) => {
    const crit = isFinal ? Math.random() < 0.55 : Math.random() < 0.26 + cloverLuck;
    if (attacker === "mine") enemyHp = Math.max(0, enemyHp - dmg);
    else mineHp = Math.max(0, mineHp - dmg);
    const atkName = attacker === "mine" ? nameMine : nameEnemy;
    const defName = attacker === "mine" ? nameEnemy : nameMine;
    const eff = attacker === "mine" ? mineEff : enemyEff;
    const stun = !isFinal && !crit && Math.random() < 0.16;
    events.push({
      kind: "attack",
      side: attacker,
      cls: attacker === "mine" ? mine.cls : enemy.cls,
      text: `${atkName} attacks!`,
      sub: crit ? "Critical hit!" : eff ? "Super effective!" : stun ? `${defName} is stunned!` : undefined,
      dmg,
      crit,
      eff,
      mineHp,
      enemyHp,
    });
  };

  for (let r = 0; r < rounds; r++) {
    const isLast = r === rounds - 1;
    const winnerHit = () => attack(winnerIsMine ? "mine" : "enemy", winnerDmgs[r], isLast);
    const loserHit = () => {
      if (r < rounds - 1) attack(winnerIsMine ? "enemy" : "mine", loserDmgs[r], false);
    };
    if (isLast) winnerHit();
    else if (winnerFaster) {
      winnerHit();
      loserHit();
    } else {
      loserHit();
      winnerHit();
    }
  }

  events.push({
    kind: "win",
    side: winnerIsMine ? "mine" : "enemy",
    text: `${winnerIsMine ? nameMine : nameEnemy} wins!`,
    mineHp,
    enemyHp,
  });

  return { events, win, mineMax, enemyMax };
}

export function seedAxols(): Axol[] {
  // Curated starter collection — varied classes/rarities/levels so the
  // Collection & pond feel full from the first session. Explicit ids give the
  // creatures friendly, stable "#numbers"; primeIds keeps new rolls above them.
  const seed = [
    generateRandomAxol({ id: 67, cls: "plant", rarity: "Rare", level: 18, generation: 1, breedCount: 1, xp: 640, status: "Sleeping" }),
    generateRandomAxol({ id: 65, cls: "bird", rarity: "Epic", level: 24, generation: 1, breedCount: 2, xp: 980, status: "Swimming" }),
    generateRandomAxol({ id: 66, cls: "aquatic", rarity: "Rare", level: 17, xp: 520, status: "Playing" }),
    generateRandomAxol({ id: 21, cls: "beast", rarity: "Epic", level: 15, xp: 410, status: "Exploring" }),
    generateRandomAxol({ id: 31, cls: "bug", rarity: "Rare", level: 12, xp: 300, status: "Fishing" }),
    generateRandomAxol({ id: 45, cls: "plant", rarity: "Common", level: 10, xp: 180, status: "Napping" }),
    generateRandomAxol({ id: 83, cls: "bird", rarity: "Common", level: 1, xp: 20, status: "Splashing" }),
    generateRandomAxol({ id: 55, cls: "aquatic", rarity: "Common", level: 1, xp: 0, status: "Playing" }),
    generateRandomAxol({ id: 11, cls: "beast", rarity: "Common", level: 1, xp: 0, status: "Napping" }),
  ].map((a) => ({ ...a, cosmeticId: undefined })); // starters use their clean class sprite
  primeIds(seed);
  return seed;
}

// ---- Live feed / quests (placeholder social flavor) -----------------------

export type FeedItem = { id: number; who: string; what: string; color: string; t: string };

let feedId = 1;
export function seedFeed(): FeedItem[] {
  return [
    { id: feedId++, who: "james.sol", what: "bred a Plant Beast!", color: "#54e07a", t: "2m" },
    { id: feedId++, who: "sarah.sol", what: "hatched a Legendary Bird!", color: "#ffb02e", t: "5m" },
    { id: feedId++, who: "mike.sol", what: "won 8 battles in a row!", color: "#3db4ff", t: "12m" },
    { id: feedId++, who: "luna.sol", what: "rolled a Rare Bug!", color: "#a779ff", t: "15m" },
  ];
}
export function feedItem(who: string, what: string, color = "#a463ff"): FeedItem {
  return { id: feedId++, who, what, color, t: "now" };
}

const PLAYERS = ["james.sol", "sarah.sol", "mike.sol", "luna.sol", "kai.sol", "nova.sol", "milo.sol", "yuki.sol", "zara.sol", "dex.sol", "remy.sol", "tess.sol"];

/** A synthetic action from another player, to keep the live feed alive. */
export function ambientFeed(): FeedItem {
  const cls = pick(CLASSES);
  const name = CLASS_META[cls].name;
  const rarity = getRarityRoll();
  const acts = [
    `rolled a ${rarity} ${name}!`,
    `hatched a Gen ${rng(1, 4)} ${name}!`,
    `won a battle with their ${name}!`,
    `listed a ${rarity} ${name} on the market`,
    `reached a ${rng(3, 14)} win streak!`,
    `bred a shiny ${name}!`,
    `pulled a Cosmic Solaxy!`,
  ];
  const what = Math.random() < 0.06 ? acts[6] : pick(acts.slice(0, 6));
  return { id: feedId++, who: pick(PLAYERS), what, color: CLASS_META[cls].color, t: pick(["now", "now", "1m", "2m", "3m"]) };
}

// ---- Presentation helpers -------------------------------------------------

/** Class badge sprites — use with `<img>` instead of emoji. */
export const ELEMENT_ICON: Record<AxolClass, string> = {
  beast: CLASS_META.beast.sprite,
  plant: CLASS_META.plant.sprite,
  aquatic: CLASS_META.aquatic.sprite,
  bird: CLASS_META.bird.sprite,
  bug: CLASS_META.bug.sprite,
  reptile: CLASS_META.reptile.sprite,
  crystal: CLASS_META.crystal.sprite,
  shadow: CLASS_META.shadow.sprite,
  mech: CLASS_META.mech.sprite,
  ember: CLASS_META.ember.sprite,
  void: CLASS_META.void.sprite,
};

/** Full-body sprite for an Axol — respects breed cosmetics & per-class cosmic art. */
export const BREED_COSMETICS = [
  "breed-01", "breed-02", "breed-03", "breed-04", "breed-05",
  "breed-06", "breed-07", "breed-08", "breed-09", "breed-10",
] as const;

export type BreedCosmeticId = (typeof BREED_COSMETICS)[number];

/** Five discoverable breed strains per element in the SolaxyDex (60 forms total). */
export const DEX_STRAINS_PER_CLASS = 5;

/** Rotate breed sprites across elements so all 10 cosmetics appear in the dex. */
export function strainCosmeticId(cls: AxolClass, strainIndex: number): BreedCosmeticId {
  const ci = CLASSES.indexOf(cls);
  return BREED_COSMETICS[(ci * DEX_STRAINS_PER_CLASS + strainIndex) % BREED_COSMETICS.length];
}

export function isDexStrainCosmetic(cls: AxolClass, cosmeticId: string): boolean {
  for (let i = 0; i < DEX_STRAINS_PER_CLASS; i++) {
    if (strainCosmeticId(cls, i) === cosmeticId) return true;
  }
  return false;
}

function pickBreedCosmetic(cls: AxolClass, rarity: Rarity): string {
  if (rarity === "Cosmic") return `cosmic-${cls}`;
  const strainIndex = Math.floor(Math.random() * DEX_STRAINS_PER_CLASS);
  return strainCosmeticId(cls, strainIndex);
}

/** Resolve the SolaxyDex entry id for an owned Axol (matches generated sprite filenames). */
export function axolDexId(a: Axol): string {
  const cls = a.cls;
  const stars = RARITY_META[a.rarity].stars;
  if (a.cosmeticId && isDexStrainCosmetic(cls, a.cosmeticId)) {
    return `${cls}-${a.cosmeticId}`;
  }
  if (a.rarity === "Cosmic" || a.cosmeticId === `cosmic-${cls}`) {
    return `cosmic-${cls}`;
  }
  if (stars >= 4) return `legendary-${cls}`;
  if (stars >= 3) return `epic-${cls}`;
  if (stars >= 2) return `rare-${cls}`;
  return `base-${cls}`;
}

export function axolSprite(a: Axol): string {
  return `/sprites/dex/${axolDexId(a)}.png`;
}

/** Backfill cosmeticId for axols bred before the cosmetics system existed. */
export function withCosmetic(a: Axol): Axol {
  if (a.cosmeticId) return a;
  if (a.rarity === "Cosmic") return { ...a, cosmeticId: `cosmic-${a.cls}` };
  if (a.parents?.length) {
    const strainIndex = a.id % DEX_STRAINS_PER_CLASS;
    return { ...a, cosmeticId: strainCosmeticId(a.cls, strainIndex) };
  }
  return a;
}

/** XP required to reach the next level (cosmetic curve). */
export function xpNeeded(level: number): number {
  return 400 + level * 50;
}

// ---- SOLAX sinks: feeding & powering up scale HARD with level ---------------
// Costs grow exponentially so every level-up makes the next upgrade far more
// expensive — a deliberate burn that keeps players buying/spending SOLAX.

function niceCost(raw: number, step: number): number {
  return Math.max(step, Math.round(raw / step) * step);
}

/** SOLAX cost to feed a creature at `level` (+XP). Grows ~1.4x per level. */
export function feedCost(level: number): number {
  return niceCost(150 * Math.pow(1.4, level - 1), 10);
}

/** SOLAX cost to power up a creature at `level` (+1 level, +stats). Grows ~1.7x per level. */
export function powerUpCost(level: number): number {
  return niceCost(800 * Math.pow(1.7, level - 1), 100);
}

/** XP granted per feed — a meaningful chunk so feeding stays worthwhile. */
export function feedXp(level: number): number {
  return Math.round(xpNeeded(level) * 0.25);
}

export function collectionPower(axols: Axol[]): number {
  return Math.round(axols.reduce((s, a) => s + a.attack + a.defense + a.hp * 0.25 + a.speed * 0.5, 0));
}

export type Ability = { name: string; icon: string; level: number };

const ABILITY_POOL: Record<AxolClass, string[]> = {
  beast: ["Beast Roar", "Claw Swipe", "Wild Charge"],
  plant: ["Leaf Storm", "Root Bind", "Photosynth"],
  aquatic: ["Bubble Beam", "Tidal Crash", "Cheer Up"],
  bird: ["Gust Dive", "Feather Dance", "Sky Call"],
  bug: ["Venom Sting", "Swarm", "Hard Shell"],
  reptile: ["Tail Whip", "Scale Guard", "Sun Bask"],
  crystal: ["Shard Burst", "Prism Guard", "Ice Pulse"],
  shadow: ["Night Slash", "Void Cloak", "Dread Gaze"],
  mech: ["Pulse Beam", "Overclock", "Hard Reset"],
  ember: ["Flame Rush", "Magma Shell", "Ash Cloud"],
  void: ["Starfall", "Rift Tear", "Gravity Well"],
};

/** Three deterministic abilities for an Axol, leveled by its rarity/level. */
export function abilities(a: Axol): Ability[] {
  const icons = ["✦", "✧", "❂"];
  const top = Math.max(1, Math.min(3, RARITY_META[a.rarity].stars - 2 + Math.floor(a.level / 12)));
  return ABILITY_POOL[a.cls].map((name, i) => ({ name, icon: icons[i], level: Math.max(1, top - i) }));
}

// ---- Chain layer lives in `lib/chain.ts` (Anchor client) -------------------
