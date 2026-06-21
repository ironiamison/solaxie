/** Harbor market item effects — boosters go to inventory; XP potions apply on purchase. */

export type BoosterKey = "luck" | "epic" | "legend" | "cosmic";

export type HarborItemEffect =
  | { kind: "booster"; key: BoosterKey; count: number }
  | { kind: "xp"; amount: number };

/** Maps MarketScreen item ids → inventory or instant XP. */
export const MARKET_ITEM_EFFECTS: Record<string, HarborItemEffect> = {
  a1: { kind: "xp", amount: 1000 },
  a2: { kind: "xp", amount: 2500 },
  a3: { kind: "booster", key: "luck", count: 1 },
  a4: { kind: "booster", key: "epic", count: 1 },
  p3: { kind: "booster", key: "epic", count: 1 },
  c3: { kind: "booster", key: "luck", count: 1 },
  n2: { kind: "booster", key: "luck", count: 1 },
  m2: { kind: "booster", key: "legend", count: 1 },
  bm3: { kind: "booster", key: "cosmic", count: 1 },
};

export function normalizeItems(items?: Record<string, number>): Record<string, number> {
  if (!items || typeof items !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(items)) {
    if (typeof v === "number" && v > 0) out[k] = v;
  }
  return out;
}
