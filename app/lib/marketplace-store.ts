import { head, put } from "@vercel/blob";
import type { Axol } from "./game";

export type MarketplaceListing = {
  id: string;
  sellerWallet: string;
  sellerName: string;
  axol: Axol;
  priceSolax: number;
  listedAt: number;
};

const BLOB_PATH = "solaxie/marketplace.json";
const MAX_LISTINGS = 200;

type Registry = { listings: MarketplaceListing[] };

const memory: Registry = { listings: [] };

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
    return Array.isArray(data.listings) ? data : null;
  } catch {
    return null;
  }
}

async function writeBlob(reg: Registry): Promise<void> {
  if (!hasBlob()) {
    memory.listings = reg.listings;
    return;
  }
  await put(BLOB_PATH, JSON.stringify(reg), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  memory.listings = reg.listings;
}

export async function getListings(): Promise<MarketplaceListing[]> {
  const fromBlob = await readBlob();
  if (fromBlob) {
    memory.listings = fromBlob.listings;
    return fromBlob.listings;
  }
  return [...memory.listings];
}

export async function addListing(
  sellerWallet: string,
  sellerName: string,
  axol: Axol,
  priceSolax: number,
): Promise<MarketplaceListing> {
  const reg = await getRegistry();
  const listing: MarketplaceListing = {
    id: `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sellerWallet,
    sellerName,
    axol,
    priceSolax,
    listedAt: Date.now(),
  };
  reg.listings = [listing, ...reg.listings.filter((l) => l.id !== listing.id)].slice(0, MAX_LISTINGS);
  await writeBlob(reg);
  return listing;
}

async function getRegistry(): Promise<Registry> {
  const listings = await getListings();
  return { listings };
}

export async function removeListing(id: string, wallet: string): Promise<MarketplaceListing | null> {
  const reg = await getRegistry();
  const found = reg.listings.find((l) => l.id === id);
  if (!found || found.sellerWallet !== wallet) return null;
  reg.listings = reg.listings.filter((l) => l.id !== id);
  await writeBlob(reg);
  return found;
}

export async function purchaseListing(id: string, buyerWallet: string): Promise<MarketplaceListing | null> {
  const reg = await getRegistry();
  const idx = reg.listings.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  const listing = reg.listings[idx]!;
  if (listing.sellerWallet === buyerWallet) return null;
  reg.listings.splice(idx, 1);
  await writeBlob(reg);
  return listing;
}

export async function findListing(id: string): Promise<MarketplaceListing | null> {
  const reg = await getRegistry();
  return reg.listings.find((l) => l.id === id) ?? null;
}
