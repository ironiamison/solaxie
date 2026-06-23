import { useMemo, useState } from "react";
import { CLASS_META } from "@/lib/game";
import { AxolSpriteImg, ClassSpriteImg } from "../primitives";
import { legendsFromAxols } from "@/lib/achievements";
import { avatarSrc } from "@/lib/profile";
import type { PublicPlayer } from "@/lib/public-player";
import { avatarForPlayer } from "@/lib/public-player";
import { LeaderboardPanel } from "../LeaderboardPanel";
import { leagueTierProgress } from "@/lib/profile";
import type { WorldApi } from "../world";
import { Panel, ScreenShell, ScreenTop, SectionTitle } from "../ScreenChrome";
import { SeasonBanner } from "../SeasonBanner";
import { EconomyTicker } from "../EconomyTicker";
import { AchievementsPanel } from "../AchievementsPanel";
import { BattleLogModal } from "../BattleLogModal";
import { TicketLeaderboardPanel } from "../TicketLeaderboardPanel";

type RightTab = "achievements" | "history";

export default function EmpireScreen({ world }: { world: WorldApi }) {
  const guest = world.viewingPlayer;
  const isGuest = !!guest;
  const p = isGuest
    ? {
        name: guest.name,
        empireName: guest.empireName,
        avatarId: guest.avatarId,
        level: guest.level,
        xp: 0,
        xpToNext: 100,
        league: guest.league,
        trophies: guest.trophies,
        leagueMax: 1600,
        rank: guest.rank,
        activityTickets: guest.activityTickets ?? 0,
        chestWins: 0,
        chestTarget: 10,
        chestLevel: 1,
      }
    : world.profile;
  const empireAxols = isGuest ? guest.axols : world.axols;
  const [rightTab, setRightTab] = useState<RightTab>("history");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(p.empireName);

  const stats = useMemo(() => {
    const gens = empireAxols.map((a) => a.generation);
    const wins = isGuest ? guest!.wins : world.battleHistory.filter((b) => b.win).length || world.quests.wins;
    return {
      axols: empireAxols.length,
      wins,
      highestGen: gens.length ? Math.max(...gens) : 0,
      hasCosmic: empireAxols.some((a) => a.rarity === "Cosmic"),
    };
  }, [empireAxols, guest, isGuest, world.battleHistory, world.quests.wins]);

  const legends = useMemo(
    () => legendsFromAxols(empireAxols, stats.wins),
    [empireAxols, stats.wins],
  );

  const chestPct = Math.round((p.chestWins / p.chestTarget) * 100);
  const leaguePct = Math.round(leagueTierProgress(p.trophies).pct);
  const xpPct = Math.round((p.xp / p.xpToNext) * 100);
  const pfp = isGuest ? avatarForPlayer(guest!) : avatarSrc(p.avatarId);

  return (
    <ScreenShell bg="/empire-bg.png" dark={0.62}>
      <ScreenTop
        world={world}
        title={isGuest ? `${guest!.name.toUpperCase()}'S EMPIRE` : "EMPIRE HALL"}
        subtitle={isGuest ? "Visiting another trainer's hall" : "Honor your legacy. Inspire your empire."}
        icon="/icon-empire.png"
      />

      {isGuest ? (
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5">
          <button
            type="button"
            onClick={() => world.closeVisitedEmpire()}
            className="mb-3 rounded-full border border-white/15 bg-ink-900/70 px-4 py-1.5 font-display text-[0.72rem] font-extrabold text-white/80 transition hover:bg-white/10"
          >
            ← Back to your Empire
          </button>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1500px] space-y-4 px-3 pb-nav sm:px-5">
        {!isGuest ? (
          <>
            <SeasonBanner world={world} />
            <EconomyTicker />
          </>
        ) : null}

        {/* top row: profile + chest */}
        <div className="grid gap-4 lg:grid-cols-12">
          <Panel className="relative overflow-hidden p-4 sm:p-5 lg:col-span-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-amber-400/5" />
            <SectionTitle accent="#c08bff">{isGuest ? "Empire Profile" : "Your Empire"}</SectionTitle>

            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <span className="absolute -inset-2 rounded-full bg-gradient-to-br from-amber-300/40 to-brand-400/30 blur-md" />
                <span className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-[3px] border-amber-300/50 bg-ink-900/80 shadow-glow sm:h-32 sm:w-32">
                  <img src={pfp} alt="" className="h-full w-full scale-110 object-cover" draggable={false} />
                </span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-amber-300/40 bg-ink-900/90 px-2.5 py-0.5 font-display text-[0.66rem] font-extrabold text-amber-200">
                  Lv. {p.level}
                </span>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                {!isGuest && editingName ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      world.setEmpireName(nameDraft.trim() || p.empireName);
                      setEditingName(false);
                      world.toast("Empire renamed!");
                    }}
                  >
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-1.5 font-display text-lg font-extrabold text-white outline-none focus:border-brand-400"
                      autoFocus
                    />
                    <button type="submit" className="rounded-lg bg-brand-500 px-2 py-1 text-xs font-bold text-white">Save</button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => { if (!isGuest) { setNameDraft(p.empireName); setEditingName(true); } }}
                    className={`group flex items-center justify-center gap-2 sm:justify-start ${isGuest ? "cursor-default" : ""}`}
                    disabled={isGuest}
                  >
                    <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">{p.empireName}</h2>
                    {!isGuest ? <span className="rounded-lg bg-white/10 px-1.5 py-0.5 text-[0.62rem] text-white/50 transition group-hover:bg-white/20">✎</span> : null}
                  </button>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniStat icon="/icon-arena.png" value={String(stats.wins)} label="Total Victories" />
                  <MiniStat icon="/icon-collection.png" value={String(stats.axols)} label="Solaxies Owned" />
                  <MiniStat icon="/icon-shrine.png" value={String(stats.highestGen)} label="Highest Gen" />
                </div>

                {isGuest && guest ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <button
                      type="button"
                      onClick={() => void world.challengeTrainer(guest.wallet)}
                      className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2 font-display text-[0.68rem] font-extrabold uppercase tracking-wide text-white shadow-glow"
                    >
                      ⚔ Challenge to Arena
                    </button>
                    <button
                      type="button"
                      onClick={() => void world.followTrainer(guest.wallet, "follow")}
                      className="rounded-xl border border-brand-400/40 bg-brand-500/15 px-4 py-2 font-display text-[0.68rem] font-extrabold uppercase tracking-wide text-brand-200"
                    >
                      + Follow
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="font-display text-2xl font-extrabold text-white">
                Current Rank <span className="text-brand-300">#{p.rank}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1">
                  <img src="/rank-bronze.png" alt="" className="h-5 w-5 object-contain" />
                  <span className="font-display text-[0.72rem] font-extrabold text-amber-200">{p.league}</span>
                </span>
                <span className="text-[0.66rem] font-bold text-white/55">
                  {p.trophies.toLocaleString()} / {p.leagueMax.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/50">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-amber-300" style={{ width: `${leaguePct}%` }} />
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[0.6rem] font-bold text-white/55">
                <span>Trainer XP</span>
                <span>{p.xp} / {p.xpToNext}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/40">
                <div className="h-full rounded-full bg-brand-400/80" style={{ width: `${xpPct}%` }} />
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-3">
              <div className="mb-1 flex justify-between text-[0.6rem] font-bold text-white/55">
                <span>Activity tickets · Season 1</span>
                <span className="text-violet-200">{(p.activityTickets ?? 0).toLocaleString()}</span>
              </div>
              <p className="text-[0.58rem] leading-snug text-white/45">
                Tickets stack from every action. Creator-reward share calculated at season end from pump.fun fees.
              </p>
            </div>
          </Panel>

          <Panel className="relative overflow-hidden p-4 sm:p-5 lg:col-span-7">
            <SectionTitle accent="#ffd24a">Empire Chest</SectionTitle>
            <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <span className="absolute inset-0 animate-pulse rounded-full bg-brand-500/25 blur-2xl" />
                <img src="/empire-chest.png" alt="" className="relative h-36 w-36 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] sm:h-44 sm:w-44" draggable={false} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="font-display text-lg font-extrabold text-white">
                  {p.chestWins} / {p.chestTarget} WINS
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full border border-brand-400/30 bg-black/40">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300" style={{ width: `${chestPct}%` }} />
                </div>
                <p className="mt-2 text-[0.72rem] font-bold text-white/60">
                  Win {Math.max(0, p.chestTarget - p.chestWins)} more battles to unlock
                </p>
                <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <img src="/egg-cosmic.png" alt="" className="h-12 w-12 object-contain" draggable={false} />
                  <div className="text-left">
                    <div className="font-display text-sm font-extrabold text-white">Epic Egg</div>
                    <div className="text-[0.62rem] font-bold text-brand-200">Empire Chest Lv. {p.chestLevel}</div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {!isGuest ? (
          <TicketLeaderboardPanel world={world} />
        ) : null}

        {/* bottom row */}
        <div className="grid gap-4 lg:grid-cols-12">
          <Panel className="p-4 lg:col-span-4">
            <LeaderboardPanel
              youWallet={world.walletAddress}
              youName={world.profile.name}
              youTrophies={world.profile.trophies}
              youAvatar={avatarSrc(world.profile.avatarId)}
              onVisit={world.visitEmpire}
              friends={world.friends}
              onFollow={world.followTrainer}
              onChallenge={(w) => void world.challengeTrainer(w)}
            />
            <button
              type="button"
              onClick={() => world.openLeaderboard()}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 font-display text-[0.72rem] font-extrabold text-white/70 transition hover:bg-white/10"
            >
              View Full Leaderboard
            </button>
          </Panel>

          <Panel className="p-4 lg:col-span-4">
            <SectionTitle accent="#c08bff">Hall of Legends</SectionTitle>
            <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
              {legends.map((leg) => (
                <div key={leg.title} className="flex flex-col items-center text-center">
                  <div
                    className="grid h-14 w-full place-items-center rounded-xl border border-white/10 bg-black/30 sm:h-16"
                    style={{ boxShadow: `inset 0 0 20px ${leg.accent}22` }}
                  >
                    <img src={leg.sprite} alt="" className="h-10 w-10 object-contain" draggable={false} />
                  </div>
                  <div className="mt-1 text-[0.48rem] font-extrabold uppercase tracking-wide text-white/45">{leg.title}</div>
                  <div className="font-display text-[0.58rem] font-extrabold leading-tight text-white">{leg.name}</div>
                  <div className="text-[0.5rem] font-bold text-white/45">{leg.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4 lg:col-span-4">
            <div className="mb-3 flex gap-1 rounded-full border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setRightTab("achievements")}
                className={`flex-1 rounded-full py-1.5 font-display text-[0.62rem] font-extrabold uppercase tracking-wide transition ${
                  rightTab === "achievements" ? "bg-brand-500 text-white" : "text-white/50"
                }`}
              >
                Achievements
              </button>
              <button
                type="button"
                onClick={() => setRightTab("history")}
                className={`flex-1 rounded-full py-1.5 font-display text-[0.62rem] font-extrabold uppercase tracking-wide transition ${
                  rightTab === "history" ? "bg-brand-500 text-white" : "text-white/50"
                }`}
              >
                Battle History
              </button>
            </div>

            {rightTab === "achievements" ? (
              isGuest ? (
                <p className="py-6 text-center text-[0.68rem] text-white/45">Achievements are private to each trainer.</p>
              ) : (
                <AchievementsPanel world={world} />
              )
            ) : (
              <div className="space-y-2">
                {world.battleHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center">
                    <img src="/icon-arena.png" alt="" className="mx-auto mb-2 h-10 w-10 opacity-40" />
                    <p className="font-display text-sm font-extrabold text-white/70">No battles yet</p>
                    <p className="mt-1 text-[0.66rem] text-white/45">Fight in the Arena to build your history</p>
                    {!isGuest ? (
                      <button type="button" onClick={() => world.setScreen("battle")} className="mt-3 rounded-full bg-brand-500 px-4 py-1.5 font-display text-[0.72rem] font-extrabold text-white">
                        Go to Arena
                      </button>
                    ) : null}
                  </div>
                ) : (
                  world.battleHistory.slice(0, 8).map((b) => (
                    <div key={b.id} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[0.62rem] font-black ${b.win ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                        {b.win ? "W" : "L"}
                      </span>
                      <ClassSpriteImg cls={b.axolCls} alt="" className="h-7 w-7 object-contain" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[0.72rem] font-extrabold text-white">vs {b.opponent}</p>
                        <p className="text-[0.58rem] text-white/50">
                          {b.axolName} · {b.win ? `+${b.rewardXp} XP · +5 DNA` : "Defeat"}
                        </p>
                      </div>
                      <span className="shrink-0 text-[0.55rem] text-white/40">{b.at}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {rightTab === "history" && world.battleHistory.length > 0 ? (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 font-display text-[0.72rem] font-extrabold text-white/70 transition hover:bg-white/10"
              >
                View All ({world.battleHistory.length})
              </button>
            ) : null}
          </Panel>
        </div>

        <Panel className="p-4">
          <SectionTitle accent="#54e07a">{isGuest ? `${guest!.name}'s Solaxies` : "Your Solaxies"}</SectionTitle>
          {empireAxols.length === 0 ? (
            <p className="mt-4 py-6 text-center text-[0.72rem] text-white/50">No Solaxies in this pond yet.</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {[...empireAxols].sort((a, b) => b.level - a.level).map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-2 text-center"
                  style={{ boxShadow: `inset 0 0 16px ${CLASS_META[a.cls].color}18` }}
                >
                  <AxolSpriteImg axol={a} alt="" className="mx-auto h-14 w-14 object-contain" />
                  <div className="mt-1 truncate font-display text-[0.62rem] font-extrabold text-white">{CLASS_META[a.cls].name}</div>
                  <div className="text-[0.52rem] font-bold text-white/45">Lv.{a.level} · {a.rarity}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <BattleLogModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={world.battleHistory}
        onGoArena={() => { setHistoryOpen(false); world.setScreen("battle"); }}
      />
    </ScreenShell>
  );
}

function MiniStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/25 px-2 py-2 text-center">
      <img src={icon} alt="" className="mx-auto h-5 w-5 object-contain opacity-80" draggable={false} />
      <div className="mt-1 font-display text-sm font-extrabold text-white">{value}</div>
      <div className="text-[0.48rem] font-bold uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}
