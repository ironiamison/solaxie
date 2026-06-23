import { head, put } from "@vercel/blob";
import {
  applyFeaturedFloors,
  featuredEntry,
  featuredPlayerProfile,
  FEATURED_LEADERS,
  isFeaturedWallet,
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
  const featured = featuredEntry(wallet);
  if (featured) {
    const index = FEATURED_LEADERS.findIndex((f) => f.wallet === wallet);
    const profile = featuredPlayerProfile(featured, Math.max(0, index));
    if (stored) {
      return applyFeaturedFloors({ ...stored, axols: profile.axols, activeId: profile.activeId }, Date.now(), true);
    }
    return profile;
  }
  return stored ?? null;
}

export async function listPlayers(): Promise<PublicPlayer[]> {
  const reg = await getRegistry();
  return pinFeaturedLeaderboard(Object.values(reg.players), "trophies");
}

export async function pickOpponent(excludeWallet: string, trophies: number): Promise<PublicPlayer | null> {
  const all = await listPlayers();
  const hydrate = (p: PublicPlayer): PublicPlayer => {
    if (!isFeaturedWallet(p.wallet) || p.axols.length > 0) return p;
    const f = featuredEntry(p.wallet);
    if (!f) return p;
    const index = FEATURED_LEADERS.findIndex((x) => x.wallet === p.wallet);
    return featuredPlayerProfile(f, Math.max(0, index));
  };
  const candidates = all.filter((p) => {
    if (p.wallet === excludeWallet) return false;
    const row = hydrate(p);
    if (!row.axols.length) return false;
    if (!row.name.trim()) return false;
    return Math.abs(row.trophies - trophies) <= 400 || row.trophies >= 1;
  }).map(hydrate);
  const pool = candidates.length
    ? candidates
    : all.filter((p) => p.wallet !== excludeWallet).map(hydrate).filter((p) => p.axols.length);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
