import type { AxolClass } from "./game";
import { CLASS_META, CLASSES } from "./game";
import type { MarketplaceListing } from "./marketplace";
import type { FriendRow } from "./marketplace";

const STORAGE_KEY = "solaxie_market_watch";
const SEEN_KEY = "solaxie_market_seen_ids";

export function getMarketWatches(): AxolClass[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is AxolClass => CLASSES.includes(c as AxolClass));
  } catch {
    return [];
  }
}

export function setMarketWatches(classes: AxolClass[]): AxolClass[] {
  const clean = classes.filter((c) => CLASSES.includes(c));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }
  return clean;
}

export function toggleMarketWatch(cls: AxolClass): AxolClass[] {
  const cur = getMarketWatches();
  const next = cur.includes(cls) ? cur.filter((c) => c !== cls) : [...cur, cls];
  return setMarketWatches(next);
}

function loadSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  const arr = Array.from(ids).slice(-200);
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
}

export type MarketAlert = {
  listing: MarketplaceListing;
  reason: "friend" | "watch";
};

/** Compare listings to prior snapshot; return alerts for new friend/watch hits. */
export function detectMarketAlerts(
  listings: MarketplaceListing[],
  friends: FriendRow[],
  watches: AxolClass[],
  seedOnly = false,
): MarketAlert[] {
  const seen = loadSeenIds();
  const friendWallets = new Set(friends.map((f) => f.wallet));
  const alerts: MarketAlert[] = [];

  for (const listing of listings) {
    if (seen.has(listing.id)) continue;
    seen.add(listing.id);

    if (seedOnly) continue;

    if (friendWallets.has(listing.sellerWallet)) {
      alerts.push({ listing, reason: "friend" });
      continue;
    }
    if (watches.includes(listing.axol.cls)) {
      alerts.push({ listing, reason: "watch" });
    }
  }

  saveSeenIds(seen);
  return alerts;
}

export function alertMessage(alert: MarketAlert): string {
  const { listing, reason } = alert;
  const name = `${CLASS_META[listing.axol.cls].name} #${listing.axol.id}`;
  if (reason === "friend") {
    return `${listing.sellerName} listed ${name} for ${listing.priceSolax.toLocaleString()} SOLAX!`;
  }
  return `Market watch: ${name} listed for ${listing.priceSolax.toLocaleString()} SOLAX`;
}
