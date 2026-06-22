import type { Axol } from "./game";

export type MarketplaceListing = {
  id: string;
  sellerWallet: string;
  sellerName: string;
  axol: Axol;
  priceSolax: number;
  listedAt: number;
};

export type FriendRow = {
  wallet: string;
  name: string;
  trophies: number;
  avatar: string;
  league: string;
  online: boolean;
  following: boolean;
};

export async function fetchFollowing(wallet: string): Promise<string[]> {
  const res = await fetch(`/api/friends?wallet=${encodeURIComponent(wallet)}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { following?: string[] };
  return data.following ?? [];
}

export async function followTrainer(wallet: string, target: string, action: "follow" | "unfollow"): Promise<string[]> {
  const res = await fetch("/api/friends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, target, action }),
  });
  if (!res.ok) throw new Error("follow failed");
  const data = (await res.json()) as { following?: string[] };
  return data.following ?? [];
}

export async function fetchFriendRows(wallet: string): Promise<FriendRow[]> {
  const res = await fetch(`/api/friends?wallet=${encodeURIComponent(wallet)}&detail=1`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { friends?: FriendRow[] };
  return data.friends ?? [];
}

export async function fetchMarketplace(): Promise<MarketplaceListing[]> {
  const res = await fetch("/api/marketplace", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { listings?: MarketplaceListing[] };
  return data.listings ?? [];
}

export async function listOnMarketplace(payload: {
  wallet: string;
  sellerName: string;
  axol: Axol;
  priceSolax: number;
}): Promise<MarketplaceListing> {
  const res = await fetch("/api/marketplace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list", ...payload }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "list failed");
  }
  return res.json() as Promise<MarketplaceListing>;
}

export async function buyMarketplaceListing(wallet: string, listingId: string): Promise<{ axol: Axol }> {
  const res = await fetch("/api/marketplace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "buy", wallet, listingId }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "buy failed");
  }
  return res.json() as Promise<{ axol: Axol }>;
}

export async function cancelMarketplaceListing(wallet: string, listingId: string): Promise<void> {
  const res = await fetch("/api/marketplace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel", wallet, listingId }),
  });
  if (!res.ok) throw new Error("cancel failed");
}
