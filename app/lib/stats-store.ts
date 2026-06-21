import { head, put } from "@vercel/blob";

export type GlobalEconomyStats = {
  /** In-game SOLAX spent (off-chain balances). */
  offChainSpent: number;
  /** In-game SOLAX burned (permanent sinks). */
  offChainBurned: number;
  updatedAt: number;
};

const BLOB_PATH = "solaxie/global-stats.json";

const DEFAULT: GlobalEconomyStats = {
  offChainSpent: 0,
  offChainBurned: 0,
  updatedAt: Date.now(),
};

const memory: GlobalEconomyStats = { ...DEFAULT };

function hasBlob(): boolean {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function readBlob(): Promise<GlobalEconomyStats | null> {
  if (!hasBlob()) return null;
  try {
    const meta = await head(BLOB_PATH);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<GlobalEconomyStats>;
    if (typeof data.offChainSpent !== "number" || typeof data.offChainBurned !== "number") return null;
    return {
      offChainSpent: data.offChainSpent,
      offChainBurned: data.offChainBurned,
      updatedAt: data.updatedAt ?? Date.now(),
    };
  } catch {
    return null;
  }
}

async function writeBlob(stats: GlobalEconomyStats): Promise<void> {
  if (!hasBlob()) {
    Object.assign(memory, stats);
    return;
  }
  await put(BLOB_PATH, JSON.stringify(stats), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  Object.assign(memory, stats);
}

export async function getEconomyStats(): Promise<GlobalEconomyStats> {
  const fromBlob = await readBlob();
  if (fromBlob) {
    Object.assign(memory, fromBlob);
    return fromBlob;
  }
  return { ...memory };
}

export async function incrementEconomyStats(delta: {
  spent?: number;
  burned?: number;
}): Promise<GlobalEconomyStats> {
  const current = await getEconomyStats();
  const spent = Math.max(0, delta.spent ?? 0);
  const burned = Math.max(0, delta.burned ?? 0);
  const next: GlobalEconomyStats = {
    offChainSpent: current.offChainSpent + spent,
    offChainBurned: current.offChainBurned + burned,
    updatedAt: Date.now(),
  };
  await writeBlob(next);
  return next;
}
