import { useCallback, useEffect, useState } from "react";
import { CLASS_META, CLASSES, RARITY_META } from "@/lib/game";
import { SEASON_1 } from "@/lib/season";
import {
  cancelMarketplaceListing,
  fetchMarketplace,
  type MarketplaceListing,
} from "@/lib/marketplace";
import type { WorldApi } from "./world";
import { AxolSpriteImg } from "./primitives";
import { Panel, SectionTitle } from "./ScreenChrome";

export function MarketplacePanel({ world }: { world: WorldApi }) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchMarketplace()
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 12_000);
    return () => clearInterval(iv);
  }, [load]);

  async function buy(listing: MarketplaceListing) {
    if (!world.walletAddress || busy) return;
    setBusy(listing.id);
    try {
      const ok = await world.buyMarketListing(listing.id, listing.priceSolax);
      if (ok) load();
    } finally {
      setBusy(null);
    }
  }

  async function cancel(id: string) {
    if (!world.walletAddress) return;
    setBusy(id);
    try {
      await cancelMarketplaceListing(world.walletAddress, id);
      world.toast("Listing cancelled");
      load();
    } catch {
      world.toast("Could not cancel listing");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel className="p-4">
      <SectionTitle accent="#2fe0cf">Player Market</SectionTitle>
      <p className="mb-3 text-[0.62rem] leading-snug text-white/50">
        Buy Solaxies from trainers. List fee {SEASON_1.listingFeeSolax.toLocaleString()} SOLAX burned · {(SEASON_1.saleTaxRate * 100).toFixed(0)}% sale tax burned.
      </p>
      <div className="mb-3">
        <div className="mb-1.5 text-[0.58rem] font-extrabold uppercase tracking-wide text-white/45">Market watch alerts</div>
        <div className="flex flex-wrap gap-1">
          {CLASSES.map((cls) => {
            const active = world.marketWatches.includes(cls);
            return (
              <button
                key={cls}
                type="button"
                onClick={() => world.toggleMarketWatch(cls)}
                className={`rounded-full border px-2 py-0.5 text-[0.56rem] font-extrabold uppercase tracking-wide transition ${
                  active ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200" : "border-white/10 bg-black/30 text-white/45 hover:bg-white/5"
                }`}
              >
                {CLASS_META[cls].name}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[0.52rem] text-white/40">Alerts when a watched class lists · friends always notify</p>
      </div>
      {loading && !listings.length ? (
        <p className="py-8 text-center text-[0.68rem] text-white/45">Loading listings…</p>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 py-8 text-center">
          <p className="font-display text-sm font-extrabold text-white/70">No listings yet</p>
          <p className="mt-1 text-[0.62rem] text-white/45">List from Collection → select a Solaxy</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {listings.map((l) => {
            const rc = RARITY_META[l.axol.rarity].color;
            const mine = l.sellerWallet === world.walletAddress;
            return (
              <div key={l.id} className="rounded-2xl border border-white/10 bg-black/30 p-3" style={{ boxShadow: `inset 0 0 16px ${rc}11` }}>
                <div className="flex gap-3">
                  <AxolSpriteImg axol={l.axol} alt="" className="h-16 w-16 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm font-extrabold text-white">{CLASS_META[l.axol.cls].name} #{l.axol.id}</div>
                    <div className="text-[0.58rem] font-bold" style={{ color: rc }}>{l.axol.rarity} · Lv.{l.axol.level}</div>
                    <div className="truncate text-[0.56rem] text-white/45">Seller: {l.sellerName}</div>
                    <div className="mt-1 font-display text-base font-extrabold text-amber-200">{l.priceSolax.toLocaleString()} SOLAX</div>
                  </div>
                </div>
                {mine ? (
                  <button
                    type="button"
                    disabled={busy === l.id}
                    onClick={() => cancel(l.id)}
                    className="mt-2 w-full rounded-xl border border-white/15 py-2 text-[0.68rem] font-extrabold text-white/70 hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel listing
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!!busy || world.purchasing}
                    onClick={() => buy(l)}
                    className="mt-2 w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 py-2 font-display text-[0.72rem] font-extrabold text-white disabled:opacity-50"
                  >
                    {busy === l.id ? "Processing…" : "Buy Solaxy"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
