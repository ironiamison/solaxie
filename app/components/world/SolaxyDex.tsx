import { useMemo, useState } from "react";
import type { Axol } from "@/lib/game";
import { CLASS_META, CLASSES, RARITY_META } from "@/lib/game";
import {
  DEX_CLASSIFIED_COUNT,
  DEX_PLAYABLE_TOTAL,
  DexEntry,
  formsForClass,
  dexBreedEntries,
  dexEntriesForLine,
  dexProgress,
  dexUnreleasedEntries,
  unlockedDexIds,
} from "@/lib/dex-catalog";
import { UI } from "@/lib/ui-icons";
import { GameIcon } from "./GameIcon";

type Filter = "all" | "breed" | "coming-soon" | (typeof CLASSES)[number];

export function SolaxyDex({ axols, onToast }: { axols: Axol[]; onToast: (msg: string) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const unlocked = useMemo(() => unlockedDexIds(axols), [axols]);
  const { unlocked: count, total, classified } = dexProgress(axols);
  const pct = Math.round((count / total) * 100);

  const breedEntries = useMemo(() => dexBreedEntries(), []);
  const unreleasedEntries = useMemo(() => dexUnreleasedEntries(), []);

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-brand-400/25 bg-gradient-to-r from-brand-500/10 via-fuchsia-500/5 to-transparent p-3 sm:p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="font-display text-lg font-extrabold text-white">Discover every form</div>
            <p className="mt-0.5 text-[0.68rem] text-white/55">
              {total} playable forms · {classified} classified Solaxies teased for future seasons.
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-extrabold text-fuchsia-200">{count}</div>
            <div className="text-[0.62rem] font-bold uppercase tracking-wide text-white/45">of {total} unlocked</div>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/45">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 via-fuchsia-400 to-amber-300 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        {CLASSES.map((c) => (
          <FilterChip
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
            label={CLASS_META[c].name}
            color={CLASS_META[c].color}
          />
        ))}
        <FilterChip active={filter === "breed"} onClick={() => setFilter("breed")} label="All Strains" color="#b06bff" />
        <FilterChip active={filter === "coming-soon"} onClick={() => setFilter("coming-soon")} label="Classified" color="#ff6bf0" />
      </div>

      {filter === "coming-soon" ? (
        <ComingSoonSection entries={unreleasedEntries} onToast={onToast} />
      ) : filter === "breed" ? (
        <section className="rounded-2xl border border-white/8 bg-black/25 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-white">Breed Strains</h3>
            <span className="text-[0.58rem] font-bold text-white/45">
              {breedEntries.filter((e) => unlocked.has(e.id)).length} / {breedEntries.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
            {breedEntries.map((e) => (
              <DexCard key={e.id} entry={e} owned={unlocked.has(e.id)} onToast={onToast} compact />
            ))}
          </div>
        </section>
      ) : filter === "all" ? (
        <div className="space-y-4">
          {CLASSES.map((line) => (
            <DexLine key={line} line={line} entries={dexEntriesForLine(line)} unlocked={unlocked} onToast={onToast} />
          ))}
          <ComingSoonSection entries={unreleasedEntries} onToast={onToast} />
        </div>
      ) : (
        <DexLine line={filter} entries={dexEntriesForLine(filter)} unlocked={unlocked} onToast={onToast} />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[0.66rem] font-extrabold uppercase tracking-wide transition ${
        active
          ? "border-brand-400/60 bg-brand-500/25 text-white shadow-glow"
          : "border-white/10 bg-black/30 text-white/55 hover:bg-white/10"
      }`}
      style={active && color ? { borderColor: `${color}88`, boxShadow: `0 0 14px ${color}33` } : undefined}
    >
      {label}
    </button>
  );
}

function ComingSoonSection({ entries, onToast }: { entries: DexEntry[]; onToast: (msg: string) => void }) {
  return (
    <section className="rounded-2xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/8 via-black/25 to-brand-500/5 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-fuchsia-200">Classified Solaxies</h3>
          <p className="text-[0.6rem] font-semibold text-white/45">Unlocking in Version 1.3 — visible now as classified teasers.</p>
        </div>
        <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-1 text-[0.58rem] font-extrabold uppercase tracking-wide text-fuchsia-200">
          {entries.length} incoming
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {entries.map((e) => (
          <DexCard key={e.id} entry={e} owned={false} onToast={onToast} compact teaser />
        ))}
      </div>
    </section>
  );
}

function DexLine({
  line,
  entries,
  unlocked,
  onToast,
}: {
  line: (typeof CLASSES)[number];
  entries: DexEntry[];
  unlocked: Set<string>;
  onToast: (msg: string) => void;
}) {
  const lineUnlocked = entries.filter((e) => unlocked.has(e.id)).length;
  const accent = CLASS_META[line].color;
  const evolution = entries.filter((e) => e.stage !== "breed");
  const strains = entries.filter((e) => e.stage === "breed");
  const formCount = formsForClass(line);

  return (
    <section className="rounded-2xl border border-white/8 bg-black/25 p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/40"
          style={{ boxShadow: `0 0 12px ${accent}33` }}
        >
          <img src={CLASS_META[line].sprite} alt="" className="h-6 w-6 object-contain" draggable={false} />
        </span>
        <div className="flex-1">
          <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-white">
            {CLASS_META[line].name} Evolution
          </h3>
          <p className="text-[0.6rem] font-semibold text-white/45">
            {lineUnlocked} / {entries.length} discovered
          </p>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[0.58rem] font-bold" style={{ color: accent, background: `${accent}18` }}>
          {formCount} forms
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-stretch gap-1.5 sm:gap-2">
        {evolution.map((e, i) => (
          <div key={e.id} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && <span className="hidden text-lg text-white/20 sm:inline">→</span>}
            <DexCard entry={e} owned={unlocked.has(e.id)} onToast={onToast} compact />
          </div>
        ))}
      </div>

      {strains.length > 0 && (
      <div className="border-t border-white/6 pt-3">
        <p className="mb-2 text-[0.56rem] font-extrabold uppercase tracking-wide text-white/40">Breed strains</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {strains.map((e) => (
            <DexCard key={e.id} entry={e} owned={unlocked.has(e.id)} onToast={onToast} compact />
          ))}
        </div>
      </div>
      )}
    </section>
  );
}

function DexCard({
  entry,
  owned,
  onToast,
  compact = false,
  teaser = false,
}: {
  entry: DexEntry;
  owned: boolean;
  onToast: (msg: string) => void;
  compact?: boolean;
  teaser?: boolean;
}) {
  const rc = RARITY_META[entry.rarity].color;
  const clsColor = entry.accentColor ?? CLASS_META[entry.cls].color;
  const isTeaser = teaser || entry.unreleased;

  return (
    <button
      onClick={() => onToast(owned ? `${entry.name} — discovered!` : entry.howToUnlock)}
      className={`group relative overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 ${
        owned ? "border-white/15 bg-gradient-to-b from-white/8 to-black/50" : "border-white/8 bg-black/40"
      } ${compact ? "p-2" : "min-w-[120px] flex-1 p-3 sm:min-w-[140px] sm:max-w-[180px]"}`}
      style={
        owned || isTeaser
          ? { boxShadow: `0 0 20px ${clsColor}22`, borderColor: `${clsColor}${isTeaser ? "55" : "44"}` }
          : undefined
      }
    >
      {!owned && (
        <span className="absolute right-1.5 top-1.5 z-10 opacity-80">
          <GameIcon src={UI.lock} size={12} />
        </span>
      )}

      <div className={`relative mx-auto ${compact ? "h-[68px] w-[68px]" : "h-[100px] w-[100px] sm:h-[120px] sm:w-[120px]"}`}>
        {!owned && !isTeaser && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-ink-900/55 backdrop-blur-[1px]">
            <span className="font-display text-lg font-extrabold text-white/25">?</span>
          </div>
        )}
        {isTeaser && (
          <div
            className="pointer-events-none absolute inset-0 z-10 rounded-xl"
            style={{ background: `linear-gradient(180deg, ${clsColor}18 0%, rgba(0,0,0,0.35) 100%)` }}
          />
        )}
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-lg transition"
          style={{
            width: compact ? 44 : 72,
            height: compact ? 14 : 24,
            background: owned || isTeaser ? `${clsColor}55` : "transparent",
          }}
        />
        <img
          src={entry.sprite}
          alt=""
          draggable={false}
          className={`relative h-full w-full object-contain transition group-hover:scale-105 ${
            owned ? "" : isTeaser ? "opacity-80 saturate-[0.85]" : "opacity-35 grayscale"
          }`}
          style={{
            filter: owned
              ? `drop-shadow(0 6px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 14px ${clsColor}44)`
              : isTeaser
              ? `drop-shadow(0 6px 8px rgba(0,0,0,0.45)) drop-shadow(0 0 16px ${clsColor}55)`
              : "drop-shadow(0 4px 6px rgba(0,0,0,0.4))",
          }}
        />
      </div>

      <div className={`mt-1.5 ${compact ? "text-center" : ""}`}>
        <div className={`truncate font-extrabold text-white ${compact ? "text-[0.54rem]" : "text-[0.72rem]"}`}>
          {owned ? entry.name : "???"}
        </div>
        <div
          className={`mt-0.5 font-bold uppercase tracking-wide ${compact ? "text-[0.46rem]" : "text-[0.54rem]"}`}
          style={{ color: owned ? rc : isTeaser ? clsColor : "rgba(255,255,255,0.35)" }}
        >
          {entry.stageLabel}
        </div>
      </div>
    </button>
  );
}

export function dexCatalogSummary(): string {
  return `${DEX_PLAYABLE_TOTAL} playable · ${DEX_CLASSIFIED_COUNT} classified · ${CLASSES.length} elements`;
}
