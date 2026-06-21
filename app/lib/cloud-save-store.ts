import { head, put } from "@vercel/blob";
import type { PondLayouts } from "./pond-layouts";
import type { BattleHistoryEntry, TrainerProfile } from "./profile";
import type { Quests } from "@/components/world/world";

export type CloudSave = {
  wallet: string;
  profile: TrainerProfile;
  quests: Quests;
  battleHistory: BattleHistoryEntry[];
  activeId: number | null;
  selectedId: number | null;
  lastDnaBonusAt?: number;
  pondLayouts?: PondLayouts;
  updatedAt: number;
};

const memory = new Map<string, CloudSave>();

function hasBlob(): boolean {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function blobPath(wallet: string) {
  return `solaxie/saves/${wallet}.json`;
}

async function readBlob(wallet: string): Promise<CloudSave | null> {
  if (!hasBlob()) return memory.get(wallet) ?? null;
  try {
    const meta = await head(blobPath(wallet));
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as CloudSave;
    return data?.wallet === wallet ? data : null;
  } catch {
    return null;
  }
}

async function writeBlob(save: CloudSave): Promise<void> {
  if (!hasBlob()) {
    memory.set(save.wallet, save);
    return;
  }
  await put(blobPath(save.wallet), JSON.stringify(save), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  memory.set(save.wallet, save);
}

export async function getCloudSave(wallet: string): Promise<CloudSave | null> {
  return readBlob(wallet);
}

export async function upsertCloudSave(save: CloudSave): Promise<void> {
  await writeBlob({ ...save, updatedAt: Date.now() });
}
