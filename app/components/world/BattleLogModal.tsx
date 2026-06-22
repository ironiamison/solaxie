import type { BattleHistoryEntry } from "@/lib/profile";
import { CLASS_META } from "@/lib/game";
import { ClassSpriteImg } from "./primitives";
import { CloseIcon } from "./GameIcon";

export function BattleLogModal({
  open,
  onClose,
  history,
  onGoArena,
}: {
  open: boolean;
  onClose: () => void;
  history: BattleHistoryEntry[];
  onGoArena?: () => void;
}) {
  if (!open) return null;

  const wins = history.filter((b) => b.win).length;
  const losses = history.length - wins;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 animate-fade">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-brand-500/25 p-5 shadow-panel animate-pop">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold text-white">Battle Log</h2>
            <p className="text-[0.68rem] text-white/50">
              {wins}W · {losses}L · {history.length} total
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 py-10 text-center">
              <p className="font-display text-sm font-extrabold text-white/70">No battles recorded</p>
              {onGoArena ? (
                <button type="button" onClick={onGoArena} className="mt-3 rounded-full bg-brand-500 px-4 py-1.5 font-display text-[0.72rem] font-extrabold text-white">
                  Go to Arena
                </button>
              ) : null}
            </div>
          ) : (
            history.map((b) => (
              <div key={b.id} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-xs font-black ${b.win ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                  {b.win ? "W" : "L"}
                </span>
                <ClassSpriteImg cls={b.axolCls} alt="" className="h-8 w-8 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[0.78rem] font-extrabold text-white">vs {b.opponent}</p>
                  <p className="text-[0.58rem] text-white/50">
                    {b.axolName} · {CLASS_META[b.axolCls].name}
                    {b.win ? ` · +${b.rewardXp} XP · +5 DNA · ${b.trophiesDelta >= 0 ? "+" : ""}${b.trophiesDelta} 🏆` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[0.55rem] text-white/40">{b.at}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
