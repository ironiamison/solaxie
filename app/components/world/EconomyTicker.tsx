import { useEffect, useState } from "react";
import { fetchEconomyTotals, formatSolax } from "@/lib/global-stats";

type DexVol = { volume24h: number; marketCap: number };

async function fetchDexVolume(): Promise<DexVol | null> {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/EBjg3JWXcLZ1U5zxMCoRppeuZZQXXQziniFLLSmfpump",
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { pairs?: { volume?: { h24?: number }; marketCap?: number; dexId?: string }[] };
    const pair = data.pairs?.find((p) => p.dexId === "pumpswap") ?? data.pairs?.[0];
    if (!pair) return null;
    return { volume24h: pair.volume?.h24 ?? 0, marketCap: pair.marketCap ?? 0 };
  } catch {
    return null;
  }
}

export function EconomyTicker({ compact }: { compact?: boolean }) {
  const [sunk, setSunk] = useState<number | null>(null);
  const [dex, setDex] = useState<DexVol | null>(null);

  useEffect(() => {
    const load = () => {
      void fetchEconomyTotals().then((s) => setSunk(s.totalSunk)).catch(() => {});
      void fetchDexVolume().then(setDex).catch(() => {});
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, []);

  const items = [
    sunk != null ? { label: "SOLAX sunk in-game", value: formatSolax(sunk), accent: "#ffb02e" } : null,
    dex ? { label: "24h DEX volume", value: `$${Math.round(dex.volume24h).toLocaleString()}`, accent: "#54e07a" } : null,
    dex ? { label: "Market cap", value: `$${Math.round(dex.marketCap).toLocaleString()}`, accent: "#3db4ff" } : null,
  ].filter(Boolean) as { label: string; value: string; accent: string }[];

  if (!items.length) {
    return (
      <div className={`flex flex-wrap gap-2 ${compact ? "" : "justify-center"}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[52px] min-w-[120px] animate-pulse rounded-xl border border-white/10 bg-black/35" />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "justify-center"}`}>
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-white/10 bg-black/35 px-3 py-2"
          style={{ boxShadow: `inset 0 0 20px ${it.accent}11` }}
        >
          <div className="text-[0.52rem] font-bold uppercase tracking-wide text-white/45">{it.label}</div>
          <div className="font-display text-sm font-extrabold" style={{ color: it.accent }}>
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
