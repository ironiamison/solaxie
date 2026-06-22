import { head, put } from "@vercel/blob";

const BLOB_PATH = "solaxie/friends.json";

type FriendsRegistry = { following: Record<string, string[]> };

const memory: FriendsRegistry = { following: {} };

function hasBlob(): boolean {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function readBlob(): Promise<FriendsRegistry | null> {
  if (!hasBlob()) return null;
  try {
    const meta = await head(BLOB_PATH);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as FriendsRegistry;
  } catch {
    return null;
  }
}

async function writeBlob(reg: FriendsRegistry): Promise<void> {
  if (!hasBlob()) {
    memory.following = reg.following;
    return;
  }
  await put(BLOB_PATH, JSON.stringify(reg), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  memory.following = reg.following;
}

export async function getFriendsRegistry(): Promise<FriendsRegistry> {
  const fromBlob = await readBlob();
  if (fromBlob) {
    memory.following = fromBlob.following;
    return fromBlob;
  }
  return { following: { ...memory.following } };
}

export async function getFollowing(wallet: string): Promise<string[]> {
  const reg = await getFriendsRegistry();
  return reg.following[wallet] ?? [];
}

export async function followWallet(wallet: string, target: string): Promise<string[]> {
  if (wallet === target) return getFollowing(wallet);
  const reg = await getFriendsRegistry();
  const list = new Set(reg.following[wallet] ?? []);
  list.add(target);
  reg.following[wallet] = Array.from(list);
  await writeBlob(reg);
  return reg.following[wallet];
}

export async function unfollowWallet(wallet: string, target: string): Promise<string[]> {
  const reg = await getFriendsRegistry();
  reg.following[wallet] = (reg.following[wallet] ?? []).filter((w) => w !== target);
  await writeBlob(reg);
  return reg.following[wallet];
}

export async function getFollowers(wallet: string): Promise<string[]> {
  const reg = await getFriendsRegistry();
  const out: string[] = [];
  for (const [follower, list] of Object.entries(reg.following)) {
    if (list.includes(wallet)) out.push(follower);
  }
  return out;
}
