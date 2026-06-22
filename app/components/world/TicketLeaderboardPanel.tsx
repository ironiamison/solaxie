import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTicketLeaderboard, type TicketLeaderboardPayload } from "@/lib/ticket-leaderboard";
import { SEASON_1 } from "@/lib/season";
import type { WorldApi } from "./world";
import { Panel, SectionTitle } from "./ScreenChrome";

export function TicketLeaderboardPanel({ world }: { world: WorldApi }) {
  const [data, setData] = useState<TicketLeaderboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const load = useCallback(() => {
    void fetchTicketLeaderboard(world.walletAddress)
      .then((payload) => {
        setData(payload);
        loadedRef.current = true;
      })
      .finally(() => setLoading(false));
  }, [world.walletAddress]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 45_000);
    return () => clearInterval(iv);
  }, [load]);

  return (
    <Panel className="p-4">
      <SectionTitle accent="#c08bff">Season Ticket Board</SectionTitle>
      <p className="mb-3 text-[0.62rem] leading-snug text-white/50">
        Global activity tickets — creator-reward share at season end. Pool total:{" "}
        <span className="font-bold text-violet-200">{(data?.totalPool ?? 0).toLocaleString()}</span>
      </p>

      {data && (
        <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-violet-400/20 bg-violet-500/5 p-2.5">
          <MiniStat label="Your tickets" value={(data.yourTickets ?? world.profile.activityTickets ?? 0).toLocaleString()} />
          <MiniStat label="Est. share" value={`${data.yourSharePct.toFixed(2)}%`} />
          <MiniStat label="Your rank" value={data.yourRank ? `#${data.yourRank}` : "—"} />
        </div>
      )}

      {loading && !loadedRef.current ? (
        <p className="py-6 text-center text-[0.68rem] text-white/45">Loading ticket board…</p>
      ) : !data?.entries.length ? (
        <p className="py-6 text-center text-[0.68rem] text-white/45">No trainers on the board yet — play to earn tickets!</p>
      ) : (
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {data.entries.slice(0, 15).map((row) => (
            <button
              key={row.wallet}
              type="button"
              onClick={() => world.visitEmpire(row.wallet)}
              className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition hover:bg-white/5 ${
                row.you ? "border-brand-400/40 bg-brand-500/10" : "border-white/8 bg-black/20"
              }`}
            >
              <span className="w-6 shrink-0 text-center font-display text-[0.72rem] font-extrabold text-white/45">
                {row.rank}
              </span>
              <img src={row.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/15" draggable={false} />
              <span className="min-w-0 flex-1 truncate font-display text-[0.78rem] font-extrabold text-white">{row.name}</span>
              <span className="shrink-0 text-[0.62rem] font-bold text-violet-200">{row.activityTickets.toLocaleString()}</span>
              <span className="shrink-0 text-[0.56rem] font-bold text-white/40">{row.sharePct.toFixed(1)}%</span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-[0.54rem] text-white/40">
        {SEASON_1.name} — snapshot at season end. Listing fee &amp; market tax continue burning SOLAX.
      </p>
    </Panel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-sm font-extrabold text-white">{value}</div>
      <div className="text-[0.52rem] font-bold uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}
