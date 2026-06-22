import { useCallback, useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/public-player";
import { leaderboardRefreshLabel } from "@/lib/public-player";
import { fetchLeaderboard } from "@/lib/global-players";
import { CloseIcon } from "./GameIcon";

type LbTab = "global" | "friends" | "empire";

function RankBadge({ rank }: { rank: number }) {
  const colors = ["", "#ffd24a", "#c0c0c0", "#cd7f32"];
  const c = colors[rank] ?? undefined;
  return (
    <span
      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-[0.72rem] font-extrabold"
      style={c ? { background: `${c}22`, color: c, border: `1px solid ${c}55` } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
    >
      {rank}
    </span>
  );
}

export function LeaderboardPanel({
  youWallet,
  youName,
  youTrophies,
  youAvatar,
  onVisit,
  onFollow,
  onChallenge,
  friends = [],
  compact,
}: {
  youWallet?: string | null;
  youName?: string;
  youTrophies?: number;
  youAvatar?: string;
  onVisit?: (wallet: string) => void;
  onFollow?: (wallet: string, action?: "follow" | "unfollow") => Promise<boolean>;
  onChallenge?: (wallet: string) => void;
  friends?: import("@/lib/marketplace").FriendRow[];
  compact?: boolean;
}) {
  const [tab, setTab] = useState<LbTab>("global");
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [refresh, setRefresh] = useState(leaderboardRefreshLabel());

  const load = useCallback(() => {
    void fetchLeaderboard(youWallet)
      .then((entries) => {
        let list = entries;
        if (youWallet && youName && !entries.some((e) => e.you)) {
          const rank = entries.findIndex((e) => e.trophies < (youTrophies ?? 0)) + 1 || entries.length + 1;
          list = [
            ...entries,
            {
              rank: rank || entries.length + 1,
              wallet: youWallet,
              name: `${youName} (You)`,
              trophies: youTrophies ?? 0,
              avatar: youAvatar ?? "/avatar-axolotl.png",
              league: "—",
              you: true,
            },
          ].sort((a, b) => b.trophies - a.trophies).map((e, i) => ({ ...e, rank: i + 1 }));
        }
        setRows(list);
        setRefresh(leaderboardRefreshLabel());
      })
      .catch(() => {});
  }, [youWallet, youName, youTrophies, youAvatar]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [load]);

  const filtered =
    tab === "empire"
      ? rows.filter((r) => Math.abs(r.trophies - (youTrophies ?? 0)) <= 350)
      : tab === "friends"
        ? []
        : rows;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-amber-200/90">Leaderboard</span>
        <span className="text-[0.58rem] font-bold text-white/45">Refreshes in: {refresh}</span>
      </div>
      <div className="mb-3 flex gap-1 rounded-full border border-white/10 bg-black/30 p-1">
        {(["global", "friends", "empire"] as LbTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-1.5 font-display text-[0.62rem] font-extrabold uppercase tracking-wide transition ${
              tab === t ? "bg-brand-500 text-white shadow-glow" : "text-white/50 hover:text-white/80"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "friends" ? (
        friends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center">
            <p className="font-display text-sm font-extrabold text-white/70">No friends yet</p>
            <p className="mt-1 text-[0.66rem] text-white/45">Follow trainers from Global — tap + on their row</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {friends.map((f) => (
              <div key={f.wallet} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2">
                <button type="button" onClick={() => onVisit?.(f.wallet)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="relative">
                    <img src={f.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20" draggable={false} />
                    {f.online ? <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-ink-900" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-display text-[0.78rem] font-extrabold text-white">{f.name}</span>
                  <span className="text-[0.62rem] font-bold text-amber-200">{f.trophies.toLocaleString()}</span>
                </button>
                {onFollow ? (
                  <button type="button" onClick={() => onFollow(f.wallet, "unfollow")} className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[0.58rem] font-bold text-white/50 hover:bg-white/5">
                    ✕
                  </button>
                ) : null}
                {onChallenge ? (
                  <button type="button" onClick={() => onChallenge(f.wallet)} className="shrink-0 rounded-lg border border-rose-400/40 bg-rose-500/15 px-2 py-1 text-[0.58rem] font-extrabold text-rose-200">
                    ⚔
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className={`space-y-1.5 ${compact ? "max-h-[340px] overflow-y-auto pr-1" : ""}`}>
          {(filtered.length ? filtered : rows).slice(0, compact ? 50 : 10).map((row) => (
            <button
              key={row.wallet}
              type="button"
              onClick={() => onVisit?.(row.wallet)}
              className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition hover:border-brand-400/35 hover:bg-brand-500/10 ${
                row.you ? "border-brand-400/40 bg-brand-500/15" : "border-white/8 bg-white/[0.03]"
              }`}
            >
              <RankBadge rank={row.rank} />
              <img src={row.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20" draggable={false} />
              <span className="min-w-0 flex-1 truncate font-display text-[0.78rem] font-extrabold text-white">{row.name}</span>
              <span className="text-[0.66rem] font-bold text-amber-200">{row.trophies.toLocaleString()}</span>
              {onFollow && youWallet && row.wallet !== youWallet && !row.you ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void onFollow(row.wallet, "follow"); }}
                  className="shrink-0 rounded-lg border border-brand-400/40 bg-brand-500/15 px-2 py-0.5 text-[0.58rem] font-extrabold text-brand-200"
                >
                  +
                </button>
              ) : null}
              {onChallenge && youWallet && row.wallet !== youWallet && !row.you ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChallenge(row.wallet); }}
                  className="shrink-0 rounded-lg border border-rose-400/40 bg-rose-500/15 px-2 py-0.5 text-[0.58rem] font-extrabold text-rose-200"
                >
                  ⚔
                </button>
              ) : null}
            </button>
          ))}
          {!filtered.length && tab === "empire" ? (
            <p className="py-4 text-center text-[0.68rem] text-white/45">No trainers in your trophy range yet — check Global</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function LeaderboardModal({
  open,
  onClose,
  youWallet,
  youName,
  youTrophies,
  youAvatar,
  onVisit,
  onFollow,
  onChallenge,
  friends = [],
}: {
  open: boolean;
  onClose: () => void;
  youWallet?: string | null;
  youName?: string;
  youTrophies?: number;
  youAvatar?: string;
  onVisit: (wallet: string) => void;
  onFollow?: (wallet: string, action?: "follow" | "unfollow") => Promise<boolean>;
  onChallenge?: (wallet: string) => void;
  friends?: import("@/lib/marketplace").FriendRow[];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 animate-fade">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong w-full max-w-md rounded-3xl border border-brand-500/25 p-5 shadow-panel animate-pop">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold uppercase tracking-wide text-amber-200">Leaderboard</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        <p className="mb-3 text-[0.68rem] text-white/50">Tap any trainer to visit their Empire Hall</p>
        <LeaderboardPanel
          youWallet={youWallet}
          youName={youName}
          youTrophies={youTrophies}
          youAvatar={youAvatar}
          onVisit={(w) => { onVisit(w); onClose(); }}
          onFollow={onFollow}
          onChallenge={(w) => { onChallenge?.(w); onClose(); }}
          friends={friends}
          compact
        />
      </div>
    </div>
  );
}
