import { head, put } from "@vercel/blob";

export type GlobalFeedEntry = {
  id: string;
  who: string;
  what: string;
  color: string;
  at: number;
};

const BLOB_PATH = "solaxie/global-feed.json";
const MAX_ENTRIES = 50;

const SEED: GlobalFeedEntry[] = [
  { id: "seed-1", who: "luna.sol", what: "bred a shiny Beast!", color: "#ffa83d", at: Date.now() - 30_000 },
  { id: "seed-2", who: "nova.sol", what: "bred a shiny Beast!", color: "#ffa83d", at: Date.now() - 45_000 },
  { id: "seed-3", who: "sarah.sol", what: "won a battle with their Bird!", color: "#ff5fb0", at: Date.now() - 60_000 },
  { id: "seed-4", who: "nova.sol", what: "bred a shiny Reptile!", color: "#ffd24a", at: Date.now() - 90_000 },
  { id: "seed-5", who: "sarah.sol", what: "reached a 13 win streak!", color: "#3db4ff", at: Date.now() - 120_000 },
];

/** Dev / no-blob fallback — shared within one serverless instance. */
const memory: { entries: GlobalFeedEntry[] } = { entries: [...SEED] };

function hasBlob(): boolean {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function readBlob(): Promise<GlobalFeedEntry[] | null> {
  if (!hasBlob()) return null;
  try {
    const meta = await head(BLOB_PATH);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { entries?: GlobalFeedEntry[] };
    return Array.isArray(data.entries) ? data.entries : null;
  } catch {
    return null;
  }
}

async function writeBlob(entries: GlobalFeedEntry[]): Promise<void> {
  if (!hasBlob()) {
    memory.entries = entries;
    return;
  }
  await put(BLOB_PATH, JSON.stringify({ entries }), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  memory.entries = entries;
}

export async function getGlobalFeed(): Promise<GlobalFeedEntry[]> {
  const fromBlob = await readBlob();
  if (fromBlob?.length) {
    memory.entries = fromBlob;
    return fromBlob;
  }
  if (memory.entries.length) return memory.entries;
  await writeBlob(SEED);
  return SEED;
}

export async function appendGlobalFeed(
  entry: Pick<GlobalFeedEntry, "who" | "what" | "color">,
): Promise<GlobalFeedEntry> {
  const current = await getGlobalFeed();
  const item: GlobalFeedEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
  };
  const next = [item, ...current.filter((e) => e.id !== item.id)].slice(0, MAX_ENTRIES);
  await writeBlob(next);
  return item;
}
