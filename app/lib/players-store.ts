import { head, put } from "@vercel/blob";
import {
  applyFeaturedFloors,
  buildFeaturedPlayer,
  featuredEntry,
  FEATURED_LEADERS,
  pinFeaturedLeaderboard,
} from "./featured-leaderboard";
import type { PublicPlayer } from "./public-player";

const BLOB_PATH = "solaxie/global-players.json";
const MAX_PLAYERS = 500;

type Registry = { players: Record<string, PublicPlayer> };

const memory: Registry = { players: {} };

function hasBlob(): boolean {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function readBlob(): Promise<Registry | null> {
  if (!hasBlob()) return null;
  try {
    const meta = await head(BLOB_PATH);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Registry;
    return data?.players ? data : null;
  } catch {
    return null;
  }
}

async function writeBlob(reg: Registry): Promise<void> {
  if (!hasBlob()) {
    memory.players = reg.players;
    return;
  }
  await put(BLOB_PATH, JSON.stringify(reg), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  memory.players = reg.players;
}

export async function getRegistry(): Promise<Registry> {
  const fromBlob = await readBlob();
  if (fromBlob) {
    memory.players = fromBlob.players;
    return fromBlob;
  }
  return { players: { ...memory.players } };
}

export async function upsertPlayer(player: PublicPlayer): Promise<void> {
  const reg = await getRegistry();
  reg.players[player.wallet] = applyFeaturedFloors(player);

  const list = Object.values(reg.players).sort((a, b) => b.trophies - a.trophies);
  const trimmed: Record<string, PublicPlayer> = {};
  list.slice(0, MAX_PLAYERS).forEach((p, i) => {
    trimmed[p.wallet] = { ...p, rank: i + 1 };
  });
  await writeBlob({ players: trimmed });
}

export async function getPlayer(wallet: string): Promise<PublicPlayer | null> {
  const reg = await getRegistry();
  const stored = reg.players[wallet];
  if (stored) return applyFeaturedFloors(stored);
  const featured = featuredEntry(wallet);
  if (!featured) return null;
  const index = FEATURED_LEADERS.findIndex((f) => f.wallet === wallet);
  return buildFeaturedPlayer(featured, Math.max(0, index));
}

export async function listPlayers(): Promise<PublicPlayer[]> {
  const reg = await getRegistry();
  return pinFeaturedLeaderboard(Object.values(reg.players), "trophies");
}

export async function pickOpponent(excludeWallet: string, trophies: number): Promise<PublicPlayer | null> {
  const all = await listPlayers();
  const candidates = all.filter((p) => {
    if (p.wallet === excludeWallet) return false;
    if (!p.axols.length) return false;
    if (!p.name.trim()) return false;
    return Math.abs(p.trophies - trophies) <= 400 || p.trophies >= 1;
  });
  const pool = candidates.length ? candidates : all.filter((p) => p.wallet !== excludeWallet && p.axols.length);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
