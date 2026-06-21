import { useCallback, useEffect, useState } from "react";
import {
  economyMeterTarget,
  fetchEconomyTotals,
  formatSolax,
  shortMint,
  type EconomyTotals,
} from "@/lib/global-stats";

function MeterBar({
  label,
  value,
  gradient,
  glow,
}: {
  label: string;
  value: number;
  gradient: string;
  glow: string;
}) {
  const target = economyMeterTarget(value);
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-white/50">{label}</span>
        <span className="font-display text-[0.78rem] font-extrabold tabular-nums text-white">{formatSolax(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-black/50">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: gradient,
            boxShadow: `0 0 12px ${glow}`,
          }}
        />
      </div>
      <div className="mt-0.5 text-right text-[0.5rem] font-bold text-white/30">next {formatSolax(target)}</div>
    </div>
  );
}

export function SpendBurnMeter() {
  const [stats, setStats] = useState<EconomyTotals | null>(null);
  const [copied, setCopied] = useState<"mint" | "program" | null>(null);

  const load = useCallback(() => {
    void fetchEconomyTotals()
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, [load]);

  const copy = async (text: string, which: "mint" | "program") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  };

  const mint = stats?.tokenMint ?? "—";
  const program = stats?.programId ?? "—";

  return (
    <aside className="absolute bottom-36 right-3 z-20 w-[min(100vw-1.5rem,17rem)]">
      <div className="glass rounded-3xl p-3.5 shadow-panel">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[0.65rem] font-extrabold uppercase tracking-widest text-brand-300">Island Economy</span>
          <span className="flex items-center gap-1 text-[0.52rem] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            live
          </span>
        </div>

        <div className="space-y-3">
          <MeterBar
            label="Total spent"
            value={stats?.totalSpent ?? 0}
            gradient="linear-gradient(90deg, #2fe0cf, #3db4ff)"
            glow="rgba(47,224,207,0.55)"
          />
          <MeterBar
            label="Total burned"
            value={stats?.totalBurned ?? 0}
            gradient="linear-gradient(90deg, #ff6b35, #ff2d7a)"
            glow="rgba(255,107,53,0.55)"
          />
        </div>

        <div className="mt-3 space-y-1.5 border-t border-white/8 pt-3">
          <div className="text-[0.52rem] font-extrabold uppercase tracking-[0.12em] text-white/35">SOLAX contract</div>
          <button
            type="button"
            onClick={() => copy(mint, "mint")}
            className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-2.5 py-1.5 text-left transition hover:border-brand-400/35 hover:bg-black/50"
            title={mint}
          >
            <img src="/icons/coin.png" alt="" className="h-4 w-4 shrink-0 object-contain" draggable={false} />
            <span className="min-w-0 flex-1 truncate font-mono text-[0.62rem] font-bold text-white/75">{shortMint(mint, 6)}</span>
            <span className="shrink-0 text-[0.55rem] font-extrabold text-brand-200/80">{copied === "mint" ? "✓" : "Copy"}</span>
          </button>
          <div className="text-[0.52rem] font-extrabold uppercase tracking-[0.12em] text-white/35">Game program</div>
          <button
            type="button"
            onClick={() => copy(program, "program")}
            className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-2.5 py-1.5 text-left transition hover:border-white/25 hover:bg-black/50"
            title={program}
          >
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-brand-500/25 text-[0.5rem]">◎</span>
            <span className="min-w-0 flex-1 truncate font-mono text-[0.62rem] font-bold text-white/55">{shortMint(program, 6)}</span>
            <span className="shrink-0 text-[0.55rem] font-extrabold text-white/40">{copied === "program" ? "✓" : "Copy"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
