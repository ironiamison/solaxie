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
  compact = false,
}: {
  label: string;
  value: number;
  gradient: string;
  glow: string;
  compact?: boolean;
}) {
  const target = economyMeterTarget(value);
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-white/50">{label}</span>
        <span className={`font-display font-extrabold tabular-nums text-white ${compact ? "text-[0.72rem]" : "text-[0.78rem]"}`}>
          {formatSolax(value)}
        </span>
      </div>
      <div className={`overflow-hidden rounded-full border border-white/10 bg-black/50 ${compact ? "h-1.5" : "h-2"}`}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: gradient,
            boxShadow: `0 0 12px ${glow}`,
          }}
        />
      </div>
      {!compact && <div className="mt-0.5 text-right text-[0.5rem] font-bold text-white/30">next {formatSolax(target)}</div>}
    </div>
  );
}

function ContractRow({
  label,
  value,
  icon,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="text-[0.52rem] font-extrabold uppercase tracking-[0.12em] text-white/35">{label}</div>
      <button
        type="button"
        onClick={onCopy}
        className="mt-1 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-2.5 py-1.5 text-left transition hover:border-brand-400/35 hover:bg-black/50"
        title={value}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate font-mono text-[0.62rem] font-bold text-white/75">{shortMint(value, 6)}</span>
        <span className="shrink-0 text-[0.55rem] font-extrabold text-brand-200/80">{copied ? "✓" : "Copy"}</span>
      </button>
    </div>
  );
}

export function SpendBurnMeter({ variant = "sidebar" }: { variant?: "sidebar" | "floating" }) {
  const [stats, setStats] = useState<EconomyTotals | null>(null);
  const [copied, setCopied] = useState<"mint" | "program" | null>(null);
  const [open, setOpen] = useState(false);

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
  const sunk = stats?.totalSunk ?? stats?.totalSpent ?? 0;

  const panel = (
    <div className="glass rounded-2xl p-3 shadow-panel">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.62rem] font-extrabold uppercase tracking-widest text-brand-300">Island Economy</span>
        <span className="flex items-center gap-1 text-[0.5rem] font-bold text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          live
        </span>
      </div>

      <MeterBar
        label="Total sunk"
        value={sunk}
        gradient="linear-gradient(90deg, #2fe0cf, #ff6b35)"
        glow="rgba(47,224,207,0.45)"
        compact
      />
      <p className="mt-1.5 text-[0.52rem] leading-snug text-white/40">
        Play and earn activity tickets. Season creator-reward payouts go live with SOLAX launch.
      </p>

      <div className="mt-2.5 space-y-1.5 border-t border-white/8 pt-2.5">
        <ContractRow
          label="SOLAX contract"
          value={mint}
          copied={copied === "mint"}
          onCopy={() => copy(mint, "mint")}
          icon={<img src="/icons/coin.png" alt="" className="h-4 w-4 shrink-0 object-contain" draggable={false} />}
        />
        <ContractRow
          label="Game program"
          value={program}
          copied={copied === "program"}
          onCopy={() => copy(program, "program")}
          icon={<span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-brand-500/25 text-[0.5rem]">◎</span>}
        />
      </div>
    </div>
  );

  if (variant === "sidebar") {
    return <div className="hidden w-60 lg:block">{panel}</div>;
  }

  // Mobile / tablet: compact chip — expands upward, stays clear of dock art
  return (
    <div className="fixed bottom-[4.6rem] right-3 z-30 lg:hidden">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="glass flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 shadow-panel backdrop-blur"
        >
          <span className="text-[0.58rem] font-extrabold uppercase tracking-wide text-brand-300">Sunk</span>
          <span className="text-[0.58rem] font-bold text-cyan-200">{formatSolax(sunk)}</span>
        </button>
      ) : (
        <div className="relative w-[min(calc(100vw-1.5rem),16rem)]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute -right-1 -top-1 z-10 grid h-6 w-6 place-items-center rounded-full border border-white/15 bg-ink-900/90 text-[0.65rem] text-white/70"
            aria-label="Close economy panel"
          >
            ✕
          </button>
          {panel}
        </div>
      )}
    </div>
  );
}
