import { useMemo } from "react";
import { computeAchievements, achievementSummary } from "@/lib/achievements";
import type { WorldApi } from "./world";

export function AchievementsPanel({ world }: { world: WorldApi }) {
  const achievements = useMemo(
    () =>
      computeAchievements({
        profile: world.profile,
        axols: world.axols,
        battleHistory: world.battleHistory,
        quests: world.quests,
      }),
    [world.profile, world.axols, world.battleHistory, world.quests],
  );
  const summary = achievementSummary(achievements);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.62rem] font-bold text-white/55">
          {summary.unlocked}/{summary.total} unlocked
        </span>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-amber-300"
            style={{ width: `${(summary.unlocked / summary.total) * 100}%` }}
          />
        </div>
      </div>
      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition ${a.unlocked ? "border-brand-400/25 bg-brand-500/10" : "border-white/8 bg-white/[0.02] opacity-70"}`}
          >
            <img src={a.icon} alt="" className={`h-9 w-9 object-contain ${a.unlocked ? "" : "grayscale"}`} draggable={false} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[0.74rem] font-extrabold" style={{ color: a.unlocked ? a.color : "rgba(255,255,255,0.55)" }}>
                {a.title}
                {a.unlocked ? " ✓" : ""}
              </p>
              <p className="text-[0.58rem] text-white/45">{a.desc}</p>
              {a.progress && !a.unlocked ? (
                <p className="text-[0.54rem] font-bold text-white/35">{a.progress}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
