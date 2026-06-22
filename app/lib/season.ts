/** Season 1 — Classified Solaxies drop + creator-reward ticket share. */

export const SEASON_1 = {
  id: "season-1-classified",
  name: "Season 1: Classified",
  /** UTC season end — ticket share snapshot + payout window. */
  endsAt: Date.UTC(2026, 6, 21, 0, 0, 0), // 21 Jul 2026
  /** Base odds per DNA spin to roll a Classified element (before luck boosters). */
  classifiedRollOdds: 0.028,
  /** Bonus luck added per booster luck point during season spins. */
  classifiedLuckMult: 0.035,
  /** Marketplace listing fee (SOLAX burned). */
  listingFeeSolax: 50_000,
  /** Sale tax rate (burned from buyer payment). */
  saleTaxRate: 0.05,
} as const;

export function isSeasonActive(now = Date.now()): boolean {
  return now < SEASON_1.endsAt;
}

export function seasonTimeRemaining(now = Date.now()): number {
  return Math.max(0, SEASON_1.endsAt - now);
}

export function formatSeasonCountdown(ms: number): string {
  if (ms <= 0) return "Ended";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function estimateTicketShare(yourTickets: number, poolTotal = 250_000): number {
  if (yourTickets <= 0) return 0;
  const pool = Math.max(poolTotal, yourTickets);
  return Math.min(100, (yourTickets / pool) * 100);
}
