import type { FeedItem } from "./game";
import type { GlobalFeedEntry } from "./feed-store";

export function formatFeedAge(at: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (sec < 45) return "now";
  if (sec < 120) return "1m";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

export function toFeedItem(entry: GlobalFeedEntry, index: number): FeedItem {
  return {
    id: index + 1,
    who: entry.who,
    what: entry.what,
    color: entry.color,
    t: formatFeedAge(entry.at),
  };
}

export async function fetchGlobalFeed(): Promise<FeedItem[]> {
  const res = await fetch("/api/feed", { cache: "no-store" });
  if (!res.ok) throw new Error("feed fetch failed");
  const data = (await res.json()) as { entries?: GlobalFeedEntry[] };
  return (data.entries ?? []).map(toFeedItem);
}

export async function postGlobalFeed(payload: {
  who: string;
  what: string;
  color?: string;
  wallet?: string;
}): Promise<void> {
  await fetch("/api/feed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
