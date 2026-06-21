import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Axol,
  AxolClass,
  CLASSES,
  CLASS_META,
  ELEMENT_ICON,
  RARITY_META,
  RARITY_ORDER,
  Rarity,
  abilities,
  axolSprite,
  feedCost,
  powerUpCost,
  xpNeeded,
} from "@/lib/game";
import { UI } from "@/lib/ui-icons";
import { GameIcon } from "../GameIcon";
import type { WorldApi } from "../world";
import { ScreenShell, ScreenTop } from "../ScreenChrome";

type DetailTab = "Details" | "Genes" | "Lineage" | "Achievements";
type SortMode = "Newest" | "Oldest" | "Level" | "Rarity";

const BOX_CAP = 50;
const POND_CAP = 5;
const POND_PER_PAGE = 3;

const POND_SPOTS = [
  { left: "26%", top: "44%", scale: 0.92 },
  { left: "50%", top: "34%", scale: 1.06 },
  { left: "74%", top: "46%", scale: 0.92 },
];

const EGG_SLOTS: { rarity: Rarity; label: string }[] = [
  { rarity: "Epic", label: "Epic" },
  { rarity: "Legendary", label: "Legendary" },
  { rarity: "Cosmic", label: "Cosmic" },
];

export default function CollectionScreen({ world }: { world: WorldApi }) {
  const { axols } = world;
  const [tab, setTab] = useState<DetailTab>("Details");
  const [query, setQuery] = useState("");
  const [elementFilter, setElementFilter] = useState<"All" | AxolClass>("All");
  const [rarityFilter, setRarityFilter] = useState<"All" | Rarity>("All");
  const [sort, setSort] = useState<SortMode>("Newest");
  const [box, setBox] = useState(0);
  const [pondPage, setPondPage] = useState(0);
  const [releaseMode, setReleaseMode] = useState(false);

  const selected = axols.find((a) => a.id === world.selectedId) ?? axols[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = axols.filter((a) => {
      if (elementFilter !== "All" && a.cls !== elementFilter) return false;
      if (rarityFilter !== "All" && a.rarity !== rarityFilter) return false;
      if (q && !`${CLASS_META[a.cls].name} ${a.rarity} ${a.id} ${a.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "Newest") return b.id - a.id;
      if (sort === "Oldest") return a.id - b.id;
      if (sort === "Level") return b.level - a.level;
      return RARITY_META[b.rarity].stars - RARITY_META[a.rarity].stars || b.level - a.level;
    });
    return list;
  }, [axols, query, elementFilter, rarityFilter, sort]);

  // Pond showcases the highest-level Solaxies, paged in groups of 3.
  const pondSource = useMemo(() => [...axols].sort((a, b) => b.level - a.level), [axols]);
  const pondTotal = pondSource.length;
  const pondPages = Math.max(1, Math.ceil(pondTotal / POND_PER_PAGE));
  const pondStart = (pondPage % pondPages) * POND_PER_PAGE;
  const pondFeatured = pondSource.slice(pondStart, pondStart + POND_PER_PAGE);

  useEffect(() => {
    if (pondPage >= pondPages) setPondPage(0);
  }, [pondPages, pondPage]);

  const onCardClick = (a: Axol) => {
    if (releaseMode) {
      world.toast(`Releasing is permanent — tap RELEASE again to cancel`);
      return;
    }
    world.setSelectedId(a.id);
  };

  return (
    <ScreenShell dark={0.72}>
      <div className="fixed inset-0 -z-10 opacity-60" style={{ backgroundImage: "radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #b794ff, transparent), radial-gradient(1px 1px at 40% 80%, #6ab7ff, transparent), radial-gradient(1px 1px at 85% 20%, #fff, transparent)", backgroundSize: "320px 320px" }} />

      <ScreenTop
        world={world}
        title="COLLECTION"
        subtitle="Your Solaxies. Your legacy."
        icon="/icon-collection.png"
        center={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-2">
              <GameIcon src={UI.search} size={16} className="opacity-60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Solaxies..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
            <Dropdown
              label={elementFilter === "All" ? "All Elements" : CLASS_META[elementFilter].name}
              options={[{ v: "All", label: "All Elements" }, ...CLASSES.map((c) => ({ v: c, label: CLASS_META[c].name }))]}
              onPick={(v) => setElementFilter(v as "All" | AxolClass)}
            />
            <Dropdown
              label={rarityFilter === "All" ? "All Rarities" : rarityFilter}
              options={[{ v: "All", label: "All Rarities" }, ...RARITY_ORDER.map((r) => ({ v: r, label: r }))]}
              onPick={(v) => setRarityFilter(v as "All" | Rarity)}
            />
            <Dropdown
              label={sort}
              options={(["Newest", "Oldest", "Level", "Rarity"] as SortMode[]).map((s) => ({ v: s, label: s }))}
              onPick={(v) => setSort(v as SortMode)}
            />
          </div>
        }
      />

      <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-3 px-3 pb-28 sm:px-5">
        {/* LEFT: pond + collection box */}
        <div className="col-span-12 space-y-3 lg:col-span-8">
          <PondView
            featured={pondFeatured}
            selectedId={selected?.id ?? null}
            indicator={`${Math.min(pondStart + POND_PER_PAGE, pondTotal)} / ${Math.max(POND_CAP, pondTotal)}`}
            canPage={pondPages > 1}
            onPrev={() => setPondPage((p) => (p - 1 + pondPages) % pondPages)}
            onNext={() => setPondPage((p) => (p + 1) % pondPages)}
            onPick={(a) => world.setSelectedId(a.id)}
            onViews={() => world.toast("Pond camera angle changed")}
            onEdit={() => world.toast("Arrange your pond — coming soon")}
          />

          <CollectionBox
            world={world}
            box={box}
            setBox={setBox}
            cards={filtered}
            selectedId={selected?.id ?? null}
            releaseMode={releaseMode}
            toggleRelease={() => { setReleaseMode((r) => !r); world.toast(releaseMode ? "Release cancelled" : "Release mode — choose a Solaxy"); }}
            onCardClick={onCardClick}
          />
        </div>

        {/* RIGHT: detail */}
        <aside className="col-span-12 lg:col-span-4">
          {selected ? (
            <DetailPanel world={world} axol={selected} tab={tab} setTab={setTab} />
          ) : (
            <div className="glass rounded-3xl p-8 text-center text-white/60 shadow-panel">
              No Solaxies yet — roll one at the DNA Core!
            </div>
          )}
        </aside>
      </div>
    </ScreenShell>
  );
}

/* ----------------------------- Dropdown ---------------------------------- */

function Dropdown({ label, options, onPick }: { label: string; options: { v: string; label: string }[]; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 whitespace-nowrap rounded-full border border-white/12 bg-black/35 px-3 py-2 text-[0.72rem] font-semibold text-white/75 transition hover:bg-white/10"
      >
        {label} <span className="text-white/40">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 min-w-[150px] overflow-hidden rounded-2xl border border-white/12 bg-ink-850/95 p-1 shadow-panel backdrop-blur">
            {options.map((o) => (
              <button
                key={o.v}
                onClick={() => { onPick(o.v); setOpen(false); }}
                className="block w-full rounded-xl px-3 py-2 text-left text-[0.74rem] font-semibold text-white/80 transition hover:bg-white/10"
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ----------------------------- Pond view --------------------------------- */

function PondView({
  featured,
  selectedId,
  indicator,
  canPage,
  onPrev,
  onNext,
  onPick,
  onViews,
  onEdit,
}: {
  featured: Axol[];
  selectedId: number | null;
  indicator: string;
  canPage: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPick: (a: Axol) => void;
  onViews: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="glass relative h-[280px] overflow-hidden rounded-3xl shadow-panel sm:h-[330px]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/collection-pond.png)" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900/45 via-transparent to-ink-900/55" />

      {/* label */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <span className="rounded-full border border-white/15 bg-ink-900/70 px-3 py-1 font-display text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-cyan-200 backdrop-blur">Your Pond</span>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-ink-900/70 text-[0.6rem] text-white/60 backdrop-blur">i</span>
      </div>

      {/* creatures */}
      {featured.map((a, i) => {
        const spot = POND_SPOTS[i] ?? POND_SPOTS[POND_SPOTS.length - 1];
        return <PondCreature key={a.id} axol={a} spot={spot} selected={a.id === selectedId} delay={i * 0.5} onClick={() => onPick(a)} />;
      })}

      {/* paging */}
      {canPage && (
        <>
          <button onClick={onPrev} className="absolute left-2 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-ink-900/70 text-white/80 backdrop-blur transition hover:bg-white/15">‹</button>
          <button onClick={onNext} className="absolute right-2 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-ink-900/70 text-white/80 backdrop-blur transition hover:bg-white/15">›</button>
        </>
      )}

      {/* footer controls */}
      <button onClick={onViews} className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-900/70 px-3 py-1.5 text-[0.66rem] font-extrabold uppercase tracking-wide text-white/80 backdrop-blur transition hover:bg-white/15">
        <span>▦</span> Pond Views
      </button>
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
        <span className="rounded-full border border-white/15 bg-ink-900/70 px-2.5 py-1 text-[0.66rem] font-bold text-white/70 backdrop-blur">{indicator}</span>
        <button onClick={onEdit} className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-ink-900/70 text-[0.7rem] text-white/70 backdrop-blur transition hover:bg-white/15">✎</button>
      </div>
    </div>
  );
}

function PondCreature({ axol, spot, selected, delay, onClick }: { axol: Axol; spot: { left: string; top: string; scale: number }; selected: boolean; delay: number; onClick: () => void }) {
  const color = CLASS_META[axol.cls].color;
  const size = 96 * spot.scale;
  return (
    <button onClick={onClick} className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: spot.left, top: spot.top }}>
      <div className={`mb-1 rounded-lg border bg-ink-900/80 px-2.5 py-1 text-center backdrop-blur transition ${selected ? "border-emerald-300/70 shadow-glow" : "border-white/12"}`}>
        <div className="whitespace-nowrap text-[0.68rem] font-extrabold leading-tight text-white">{CLASS_META[axol.cls].name} #{axol.id}</div>
        <div className="text-[0.55rem] font-semibold text-cyan-200/80">Lv.{axol.level}</div>
        <div className="text-[0.5rem] text-white/50">{axol.status}</div>
      </div>
      <div className="relative" style={{ width: size, height: size }}>
        <span className="absolute bottom-2 left-1/2 h-3 w-2/3 -translate-x-1/2 animate-ripple rounded-[50%] border border-cyan-100/50" style={{ animationDelay: `${delay}s` }} />
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full blur-lg" style={{ width: size * 0.55, height: size * 0.3, background: `${color}55` }} />
        <div className="animate-bob" style={{ animationDelay: `${delay}s` }}>
          <img src={axolSprite(axol)} alt="" className="mx-auto transition group-hover:scale-105" style={{ width: size, height: size, objectFit: "contain", filter: `drop-shadow(0 7px 6px rgba(0,0,0,0.45)) drop-shadow(0 0 12px ${color}55)` }} draggable={false} />
        </div>
      </div>
    </button>
  );
}

/* --------------------------- Collection box ------------------------------ */

function CollectionBox({
  world,
  box,
  setBox,
  cards,
  selectedId,
  releaseMode,
  toggleRelease,
  onCardClick,
}: {
  world: WorldApi;
  box: number;
  setBox: (n: number) => void;
  cards: Axol[];
  selectedId: number | null;
  releaseMode: boolean;
  toggleRelease: () => void;
  onCardClick: (a: Axol) => void;
}) {
  const total = world.axols.length;
  const isBox1 = box === 0;
  const showCards = isBox1 ? cards : [];

  return (
    <div className="glass rounded-3xl p-3 shadow-panel sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-white">Collection Box</h2>
          <span className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[0.62rem] font-bold text-white/60">
            <GameIcon src={UI.paw} size={14} /> {total} / {BOX_CAP}
          </span>
        </div>
        <button
          onClick={toggleRelease}
          className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-wide transition ${
            releaseMode ? "border-rose-400/60 bg-rose-500/20 text-rose-200" : "border-white/12 bg-black/30 text-white/55 hover:bg-white/10"
          }`}
        >
          <GameIcon src={UI.trash} size={14} /> Release
        </button>
      </div>

      {/* box tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {[0, 1, 2, 3].map((b) => (
          <button
            key={b}
            onClick={() => setBox(b)}
            className={`rounded-xl px-3 py-1.5 text-[0.72rem] font-bold transition ${
              box === b ? "bg-gradient-to-r from-brand-400 to-brand-600 text-white shadow-glow" : "bg-black/30 text-white/55 hover:bg-white/10"
            }`}
          >
            Box {b + 1}
          </button>
        ))}
        <button onClick={() => world.toast("Box 5 unlocks at Trainer Lv.10")} className="flex items-center gap-1 rounded-xl bg-black/30 px-3 py-1.5 text-[0.72rem] font-bold text-white/40 transition hover:bg-white/10">
          Box 5 <GameIcon src={UI.lock} size={14} className="inline-block" />
        </button>
        <button onClick={() => world.toast("Purchase extra boxes in the Market")} className="grid h-8 w-8 place-items-center rounded-xl border border-dashed border-white/20 text-white/50 transition hover:bg-white/10">+</button>
      </div>

      {/* grid */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {showCards.map((a) => (
          <BoxCard key={a.id} axol={a} selected={a.id === selectedId} active={world.activeId === a.id} releaseMode={releaseMode} onClick={() => onCardClick(a)} />
        ))}

        {isBox1 && (
          <>
            {EGG_SLOTS.map((e) => (
              <EggSlot key={e.label} rarity={e.rarity} label={e.label} onClick={() => world.toast(`Hatch a ${e.label} egg at the DNA Core!`)} />
            ))}
            <UpgradeSlot total={total} onClick={() => world.toast("Upgrade your box to hold more Solaxies")} />
          </>
        )}

        {!isBox1 && (
          <div className="col-span-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 py-10 text-center sm:col-span-7">
            <GameIcon src={UI.egg} size={36} className="opacity-60" />
            <p className="text-[0.72rem] text-white/50">Box {box + 1} is empty — breed or roll new Solaxies to fill it.</p>
            <button onClick={() => world.setScreen("dnacore")} className="rounded-full bg-gradient-to-r from-[#8a37ff] to-[#d63cff] px-4 py-1.5 text-[0.7rem] font-extrabold text-white shadow-glow">Roll DNA</button>
          </div>
        )}
      </div>
    </div>
  );
}

function BoxCard({ axol, selected, active, releaseMode, onClick }: { axol: Axol; selected: boolean; active: boolean; releaseMode: boolean; onClick: () => void }) {
  const rc = RARITY_META[axol.rarity].color;
  const cc = CLASS_META[axol.cls].color;
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-black/25 to-black/55 p-2 text-center transition hover:-translate-y-0.5 ${
        selected ? "border-emerald-300 ring-2 ring-emerald-300/50" : releaseMode ? "border-rose-400/40 hover:border-rose-400" : "border-white/10 hover:border-white/30"
      }`}
      style={selected ? { boxShadow: "0 0 18px rgba(84,224,122,0.35)" } : undefined}
    >
      <span className="absolute left-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/55">
        <img src={ELEMENT_ICON[axol.cls]} alt="" className="h-3.5 w-3.5 object-contain" draggable={false} />
      </span>
      <span className="absolute right-1.5 top-1.5 z-10 text-[0.78rem]" style={{ color: active ? "#ffd24a" : rc, textShadow: active ? "0 0 8px #ffd24a" : "none" }}>{active ? "★" : "☆"}</span>
      <div className="relative mx-auto" style={{ width: 70, height: 60 }}>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-md" style={{ width: 44, height: 12, background: `${cc}55` }} />
        <img src={axolSprite(axol)} alt="" className="relative mx-auto h-[60px] w-[60px] object-contain transition group-hover:scale-110" draggable={false} style={{ filter: "drop-shadow(0 5px 5px rgba(0,0,0,0.45))" }} />
      </div>
      <div className="mt-0.5 truncate text-[0.66rem] font-extrabold text-white">{CLASS_META[axol.cls].name} #{axol.id}</div>
      <div className="text-[0.56rem] text-white/45">Lv.{axol.level}</div>
    </button>
  );
}

function EggSlot({ rarity, label, onClick }: { rarity: Rarity; label: string; onClick: () => void }) {
  const rc = RARITY_META[rarity].color;
  return (
    <button onClick={onClick} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2 text-center transition hover:-translate-y-0.5 hover:border-white/25">
      <GameIcon src={UI.lock} size={12} className="absolute right-1.5 top-1.5 opacity-60" />
      <div className="relative mx-auto grid place-items-center" style={{ width: 70, height: 60 }}>
        <span className="absolute rounded-full blur-xl" style={{ width: 44, height: 44, background: `${rc}55` }} />
        <img src="/egg-cosmic.png" alt="" className="relative h-[54px] w-[54px] object-contain transition group-hover:scale-110" draggable={false} style={{ filter: `drop-shadow(0 0 10px ${rc}aa)` }} />
      </div>
      <div className="mt-0.5 text-[0.66rem] font-extrabold text-white/70">???</div>
      <div className="text-[0.54rem] font-bold uppercase tracking-wide" style={{ color: rc }}>{label}</div>
    </button>
  );
}

function UpgradeSlot({ total, onClick }: { total: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group grid place-items-center rounded-2xl border border-dashed border-white/20 bg-black/20 p-2 text-center transition hover:-translate-y-0.5 hover:border-white/40">
      <div className="grid h-[60px] w-[60px] place-items-center text-3xl text-white/30 transition group-hover:text-white/60">+</div>
      <div className="text-[0.6rem] font-bold text-white/55">{total} / {BOX_CAP}</div>
      <div className="text-[0.5rem] font-bold uppercase tracking-wide text-white/35">Upgrade Box</div>
    </button>
  );
}

/* ----------------------------- Detail panel ------------------------------ */

function DetailPanel({ world, axol, tab, setTab }: { world: WorldApi; axol: Axol; tab: DetailTab; setTab: (t: DetailTab) => void }) {
  const rc = RARITY_META[axol.rarity].color;
  const cc = CLASS_META[axol.cls].color;
  const isActive = world.activeId === axol.id;
  const need = xpNeeded(axol.level);
  const xpPct = Math.min(100, Math.round((axol.xp / need) * 100));

  return (
    <div className="glass overflow-hidden rounded-3xl shadow-panel">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-black/40">
            <img src={ELEMENT_ICON[axol.cls]} alt="" className="h-6 w-6 object-contain" draggable={false} />
          </span>
          <span className="font-display text-lg font-extrabold text-white">{CLASS_META[axol.cls].name} #{axol.id}</span>
          <span className="text-base" style={{ color: isActive ? "#ffd24a" : "rgba(255,255,255,0.3)", textShadow: isActive ? "0 0 8px #ffd24a" : "none" }}>★</span>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-wide" style={{ background: `${rc}22`, color: rc, border: `1px solid ${rc}66` }}>{axol.rarity}</span>
      </div>

      {/* art + facts */}
      <div className="grid grid-cols-5 gap-2 px-4 py-3">
        <div className="col-span-3 relative grid place-items-center rounded-2xl" style={{ background: `radial-gradient(110% 90% at 50% 30%, ${cc}33, transparent 70%)` }}>
          <span className="absolute bottom-4 h-8 w-28 rounded-[50%] blur-xl" style={{ background: `${cc}66` }} />
          <img src={axolSprite(axol)} alt="" className="relative h-36 w-36 animate-floaty object-contain" draggable={false} style={{ filter: `drop-shadow(0 12px 14px rgba(0,0,0,0.55)) drop-shadow(0 0 16px ${cc}55)` }} />
        </div>
        <div className="col-span-2 flex flex-col justify-center gap-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-2">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-sm font-extrabold text-white">Lv.{axol.level}</span>
              <span className="text-[0.56rem] text-white/45">/ {axol.level + 12}</span>
            </div>
            <div className="my-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
              <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${cc}, #ff7ad1)` }} />
            </div>
            <div className="text-[0.54rem] font-semibold text-white/50">{axol.xp} / {need} XP</div>
          </div>
          <Fact k="Element" v={<span className="inline-flex items-center gap-1"><img src={ELEMENT_ICON[axol.cls]} alt="" className="h-4 w-4 object-contain" draggable={false} /> {CLASS_META[axol.cls].name}</span>} />
          <Fact k="Rarity" v={<span style={{ color: rc }}>{axol.rarity}</span>} />
          <Fact k="Generation" v={`Gen ${axol.generation}`} />
          <Fact k="Breeds" v={`${axol.breedCount} / ${axol.maxBreedCount}`} />
          <Fact k="Owner" v={world.profile.name} />
        </div>
      </div>

      {/* stats */}
      <div className="px-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-white/45">Stats</span>
          <button onClick={() => setTab("Genes")} className="text-[0.6rem] font-bold text-brand-300 hover:underline">See All</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCell icon={UI.heart} label="HP" v={axol.hp} c="#ff6b6b" />
          <StatCell icon={UI.sword} label="ATK" v={axol.attack} c="#ffb02e" />
          <StatCell icon={UI.shield} label="DEF" v={axol.defense} c="#3db4ff" />
          <StatCell icon={UI.energy} label="SPD" v={axol.speed} c="#54e07a" />
          <StatCell icon={UI.skill} label="SKILL" v={axol.skill} c="#c08bff" />
          <StatCell icon={UI.flame} label="MORALE" v={axol.morale} c="#ff8a3d" />
        </div>
      </div>

      {/* actions */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        <Action
          label="Feed"
          icon={UI.heart}
          color="#ff6b6b"
          cost={feedCost(axol.level)}
          onClick={() => {
            const c = feedCost(axol.level);
            world.feedAxol(axol.id)
              ? world.toast(`Fed ${CLASS_META[axol.cls].name} #${axol.id} · −${c.toLocaleString()} SOLAX`)
              : world.toast(`Need ${c.toLocaleString()} SOLAX to feed`);
          }}
        />
        <Action
          label="Power Up"
          icon={UI.boost}
          color="#54e07a"
          cost={powerUpCost(axol.level)}
          onClick={() => {
            const c = powerUpCost(axol.level);
            world.powerUp(axol.id)
              ? world.toast(`Powered up to Lv.${axol.level + 1}! · −${c.toLocaleString()} SOLAX`)
              : world.toast(`Need ${c.toLocaleString()} SOLAX to power up`);
          }}
        />
        <Action label={isActive ? "Active" : "Set Active"} icon={UI.crown} color="#ffb02e" active={isActive} onClick={() => { world.setActive(axol.id); world.toast(`${CLASS_META[axol.cls].name} #${axol.id} set as leader`); }} />
        <Action label="Breed" icon={UI.egg} color="#b06bff" onClick={() => world.openBreed()} />
      </div>

      {/* tabs */}
      <div className="flex gap-1 border-t border-white/8 px-3 pt-2">
        {(["Details", "Genes", "Lineage", "Achievements"] as DetailTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex-1 px-1 py-2 text-[0.62rem] font-extrabold uppercase tracking-wide transition ${tab === t ? "text-white" : "text-white/45 hover:text-white/70"}`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 pt-3">
        {tab === "Details" && <LineageView world={world} axol={axol} />}
        {tab === "Lineage" && <LineageView world={world} axol={axol} expanded />}
        {tab === "Genes" && <GenesView axol={axol} cc={cc} rc={rc} />}
        {tab === "Achievements" && <AchievementsView axol={axol} />}
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[0.72rem]">
      <span className="text-white/45">{k}</span>
      <span className="font-bold text-white">{v}</span>
    </div>
  );
}

function StatCell({ icon, label, v, c }: { icon: string; label: string; v: number; c: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">
      <GameIcon src={icon} size={16} glow={c} />
      <span className="text-[0.58rem] font-bold uppercase tracking-wide" style={{ color: c }}>{label}</span>
      <span className="ml-auto font-display text-sm font-extrabold text-white">{v}</span>
    </div>
  );
}

function Action({ label, icon, color, onClick, active, cost }: { label: string; icon: string; color: string; onClick: () => void; active?: boolean; cost?: number }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 text-center transition hover:-translate-y-0.5"
      style={{ borderColor: `${color}55`, background: active ? `${color}33` : `${color}14` }}
    >
      <GameIcon src={icon} size={18} glow={color} />
      <span className="text-[0.56rem] font-extrabold uppercase tracking-wide" style={{ color }}>{label}</span>
      {cost != null && (
        <span className="flex items-center gap-0.5 text-[0.5rem] font-bold text-amber-300/90">
          <img src="/icons/coin.png" alt="" className="h-2.5 w-2.5" /> {cost.toLocaleString()}
        </span>
      )}
    </button>
  );
}

/* ----------------------------- Tab content ------------------------------- */

type Ancestor = { id: number; cls: AxolClass; level: number; rarity: Rarity };

function synthAncestor(id: number, hint?: AxolClass): Ancestor {
  const cls = hint ?? CLASSES[id % CLASSES.length];
  const level = 1 + ((id * 7) % 30);
  const rarity = RARITY_ORDER[(id * 3) % RARITY_ORDER.length];
  return { id, cls, level, rarity };
}

function resolveAncestor(world: WorldApi, id: number, hint?: AxolClass): Ancestor {
  const real = world.axols.find((a) => a.id === id);
  if (real) return { id: real.id, cls: real.cls, level: real.level, rarity: real.rarity };
  return synthAncestor(id, hint);
}

function LineageView({ world, axol, expanded }: { world: WorldApi; axol: Axol; expanded?: boolean }) {
  if (axol.generation === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-center">
        <GameIcon src={UI.sprout} size={32} className="mx-auto" />
        <div className="mt-1 font-display text-sm font-extrabold text-white">Genesis Solaxy</div>
        <p className="mt-1 text-[0.66rem] text-white/50">A first-generation Solaxy with no ancestry — its bloodline starts here.</p>
        <div className="mt-3 flex items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-[0.62rem] font-bold text-amber-200">
          <GameIcon src={UI.shield} size={14} className="inline-block" /> Founder of a new dynasty <GameIcon src={UI.crown} size={14} className="inline-block" />
        </div>
      </div>
    );
  }

  const parentIds = axol.parents ?? [((axol.id * 2) % 60) + 1, ((axol.id * 2) % 60) + 8];
  const parents = parentIds.map((pid) => resolveAncestor(world, pid, axol.cls));
  const grandIds = parents.flatMap((p) => [((p.id * 3) % 91) + 1, ((p.id * 5) % 83) + 1]);
  const grandparents = grandIds.map((gid, i) => resolveAncestor(world, gid, parents[Math.floor(i / 2)].cls));

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-white/40">Parents</div>
        <div className="grid grid-cols-2 gap-2">
          {parents.map((p, i) => <AncestorCard key={`p-${p.id}-${i}`} a={p} world={world} size="md" />)}
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-white/40">Grandparents</div>
        <div className="grid grid-cols-4 gap-2">
          {grandparents.map((g, i) => <AncestorCard key={`g-${g.id}-${i}`} a={g} world={world} size="sm" />)}
        </div>
      </div>

      {expanded && (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-[0.66rem] text-white/60">
          <div className="mb-1 font-bold text-white/80">Bloodline</div>
          Generation {axol.generation} descendant · {parents.length} known parents · {grandparents.length} grandparents traced.
        </div>
      )}

      <div className="flex items-center justify-center gap-2 rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-2 text-[0.64rem] font-bold text-violet-200">
        Descendant of <GameIcon src={UI.shield} size={14} className="inline-block" /> Emperor #1 <GameIcon src={UI.crown} size={14} className="inline-block" />
      </div>
    </div>
  );
}

function AncestorCard({ a, world, size }: { a: Ancestor; world: WorldApi; size: "sm" | "md" }) {
  const cc = CLASS_META[a.cls].color;
  const rc = RARITY_META[a.rarity].color;
  const inCollection = world.axols.some((x) => x.id === a.id);
  const dim = size === "sm";
  return (
    <button
      onClick={() => inCollection && world.setSelectedId(a.id)}
      className={`relative overflow-hidden rounded-xl border bg-black/30 p-1.5 text-center transition ${inCollection ? "border-white/15 hover:border-white/40" : "border-white/8 opacity-90"}`}
      style={{ cursor: inCollection ? "pointer" : "default" }}
    >
      <span className="absolute left-1 top-1">
        <img src={ELEMENT_ICON[a.cls]} alt="" className="h-3.5 w-3.5 object-contain" draggable={false} />
      </span>
      <div className="relative mx-auto grid place-items-center" style={{ width: dim ? 38 : 52, height: dim ? 38 : 52 }}>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-md" style={{ width: dim ? 22 : 30, height: 8, background: `${cc}55` }} />
        <img src={CLASS_META[a.cls].sprite} alt="" className="relative object-contain" style={{ width: dim ? 36 : 50, height: dim ? 36 : 50 }} draggable={false} />
      </div>
      {!dim && <div className="mt-0.5 truncate text-[0.6rem] font-bold text-white">{CLASS_META[a.cls].name} #{a.id}</div>}
      <div className="text-[0.52rem] font-semibold" style={{ color: dim ? rc : "rgba(255,255,255,0.5)" }}>Lv.{a.level}</div>
    </button>
  );
}

function GenesView({ axol, cc, rc }: { axol: Axol; cc: string; rc: string }) {
  return (
    <div className="space-y-1.5">
      {(Object.entries(axol.genes) as [string, string][]).map(([part, val], i) => (
        <div key={part} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[0.74rem]">
          <span className="capitalize text-white/70">{part}</span>
          <span className="font-bold" style={{ color: i % 2 ? cc : rc }}>{val}</span>
        </div>
      ))}
      <div className="pt-1">
        <div className="mb-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-white/40">Abilities</div>
        {abilities(axol).map((ab) => (
          <div key={ab.name} className="mb-1.5 flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
            <span className="flex items-center gap-2 text-[0.74rem] font-bold text-white">
              <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: `${rc}33`, color: rc }}>{ab.icon}</span>
              {ab.name}
            </span>
            <span className="text-[0.6rem] font-bold text-white/40">Lv {ab.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsView({ axol }: { axol: Axol }) {
  const stars = RARITY_META[axol.rarity].stars;
  const list = [
    { name: "Hatched", desc: "Joined your collection", done: true },
    { name: "Growing Up", desc: "Reach Lv.10", done: axol.level >= 10 },
    { name: "Seasoned", desc: "Reach Lv.25", done: axol.level >= 25 },
    { name: "Rare Blood", desc: "Rare or higher", done: stars >= 2 },
    { name: "Elite Bloodline", desc: "Epic or higher", done: stars >= 3 },
    { name: "Battle Veteran", desc: "Reach Lv.15", done: axol.level >= 15 },
    { name: "Breeder", desc: "Bred at least once", done: axol.breedCount > 0 },
    { name: "Legacy", desc: `Reach Gen ${Math.max(1, axol.generation)}`, done: axol.generation >= 1 },
  ];
  const unlocked = list.filter((l) => l.done).length;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[0.62rem] font-bold text-white/55">
        <span>{unlocked} / {list.length} unlocked</span>
        <span className="inline-flex items-center gap-1 text-amber-300"><GameIcon src={UI.trophy} size={14} /> {unlocked * 25} pts</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {list.map((a) => (
          <div key={a.name} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${a.done ? "border-amber-300/30 bg-amber-400/10" : "border-white/8 bg-black/25"}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full ${a.done ? "bg-amber-400 text-black" : "bg-white/10"}`}>
              {a.done ? <span className="text-[0.62rem] font-extrabold">✓</span> : <GameIcon src={UI.lock} size={14} className="opacity-60" />}
            </span>
            <div className="flex-1">
              <div className={`text-[0.72rem] font-bold ${a.done ? "text-white" : "text-white/50"}`}>{a.name}</div>
              <div className="text-[0.56rem] text-white/40">{a.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
