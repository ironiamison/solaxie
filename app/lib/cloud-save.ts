import type { CloudSave } from "./cloud-save-store";
import type { PondLayouts } from "./pond-layouts";
import type { BattleHistoryEntry, TrainerProfile } from "./profile";
import type { Quests } from "@/components/world/world";

export type CloudSavePayload = {
  wallet: string;
  profile: TrainerProfile;
  quests: Quests;
  battleHistory: BattleHistoryEntry[];
  activeId: number | null;
  selectedId: number | null;
  lastDnaBonusAt?: number;
  pondLayouts?: PondLayouts;
};

export async function fetchCloudSave(wallet: string): Promise<CloudSave | null> {
  try {
    const res = await fetch(`/api/save?wallet=${encodeURIComponent(wallet)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { save: CloudSave | null };
    return data.save;
  } catch {
    return null;
  }
}

export async function postCloudSave(payload: CloudSavePayload): Promise<boolean> {
  try {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
