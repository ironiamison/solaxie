import { useEffect, useState } from "react";
import { SEASON_1, estimateTicketShare, formatSeasonCountdown, isSeasonActive, seasonTimeRemaining } from "@/lib/season";
import { fetchTicketLeaderboard } from "@/lib/ticket-leaderboard";
import type { WorldApi } from "./world";

export function SeasonBanner({ world }: { world: WorldApi }) {
  const [now, setNow] = useState(() => Date.now());
  const [poolTotal, setPoolTotal] = useState<number | null>(null);
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    void fetchTicketLeaderboard(world.walletAddress)
      .then((d) => setPoolTotal(d.totalPool))
      .catch(() => {});
  }, [world.walletAddress]);

  if (!isSeasonActive(now)) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-center">
        <p className="font-display text-sm font-extrabold text-white/70">Season 1 ended</p>
        <p className="text-[0.62rem] text-white/45">Creator-reward payout window — tickets locked at season end.</p>
      </div>
    );
  }

  const ms = seasonTimeRemaining(now);
  const tickets = world.profile.activityTickets ?? 0;
  const share = estimateTicketShare(tickets, poolTotal ?? undefined);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-cyan-400/30 px-4 py-3"
      style={{ background: "linear-gradient(135deg, rgba(46,224,207,0.12) 0%, rgba(168,99,255,0.1) 100%)" }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-display text-[0.62rem] font-extrabold uppercase tracking-[0.2em] text-cyan-200/90">
            {SEASON_1.name}
          </div>
          <div className="font-display text-lg font-extrabold text-white">Classified drops live</div>
          <p className="mt-0.5 max-w-md text-[0.62rem] leading-snug text-white/55">
            ~{(SEASON_1.classifiedRollOdds * 100).toFixed(1)}% DNA spin odds for Zephyr, Nocturne, Mycelium, Solara, Glacier & Mirage.
            Stack tickets for creator-reward share.
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-extrabold tabular-nums text-cyan-200">{formatSeasonCountdown(ms)}</div>
          <div className="text-[0.58rem] font-bold uppercase tracking-wide text-white/45">remaining</div>
          <div className="mt-1 text-[0.62rem] font-bold text-violet-200">
            {tickets.toLocaleString()} tickets · ~{share.toFixed(2)}% est. share
            {poolTotal != null ? ` · pool ${poolTotal.toLocaleString()}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
