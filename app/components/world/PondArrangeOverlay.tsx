import { Axol } from "@/lib/game";
import { PondLayer } from "./PondLayer";
import type { PondLayout, PondSpotPct } from "@/lib/pond-layout";

/** Full-screen editor — one consistent pond canvas so drag positions make sense. */
export function PondArrangeOverlay({
  axols,
  layout,
  view,
  onSpotChange,
  onDone,
  onReset,
}: {
  axols: Axol[];
  layout: PondLayout;
  view: "home" | "collection";
  onSpotChange: (axolId: number, spot: PondSpotPct) => void;
  onDone: () => void;
  onReset: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-900/88 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative flex h-full w-full max-w-4xl flex-col">
        <header className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-white">
              Arrange {view === "home" ? "Island Pond" : "Collection Pond"}
            </h2>
            <p className="text-[0.65rem] text-white/50">Drag each Solaxy — position saves to your wallet</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[0.65rem] font-bold text-white/70 transition hover:bg-white/10"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-full border border-emerald-400/60 bg-emerald-500/25 px-4 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-emerald-100"
            >
              Done
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/12 shadow-panel">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/collection-pond.png)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/35 via-transparent to-ink-900/45" />

          {axols.length === 0 ? (
            <div className="grid h-full place-items-center text-[0.75rem] text-white/50">No Solaxies to arrange yet</div>
          ) : (
            <PondLayer
              axols={axols}
              layout={layout}
              arranging
              variant="collection"
              onSpotChange={onSpotChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
