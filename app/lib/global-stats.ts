export type EconomyTotals = {
  totalSpent: number;
  totalBurned: number;
  offChainSpent: number;
  offChainBurned: number;
  vaultSolax: number;
  programId: string;
  tokenMint: string;
  updatedAt: number;
};

export async function fetchEconomyTotals(): Promise<EconomyTotals> {
  const res = await fetch("/api/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("stats fetch failed");
  return res.json() as Promise<EconomyTotals>;
}

export async function recordEconomy(delta: { spent?: number; burned?: number }): Promise<void> {
  if (!(delta.spent || delta.burned)) return;
  await fetch("/api/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(delta),
  });
}

/** Next milestone for meter fill (log-style scale). */
export function economyMeterTarget(n: number): number {
  const steps = [
    50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000,
    10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000, 1_000_000_000,
  ];
  return steps.find((s) => s > n) ?? steps[steps.length - 1];
}

export function formatSolax(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

export function shortMint(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}
