import { useEffect, useRef, useState } from "react";
import {
  Axol,
  AxolClass,
  BattleResult,
  CLASS_META,
  COSTS,
  ELEMENT_ICON,
  RARITY_META,
  Resources,
  axolClassSprite,
  axolSprite,
  breedCompatibility,
  possibleElements,
} from "@/lib/game";
import { sfx } from "@/lib/sfx";
import { formatTrainerName, validateUsername } from "@/lib/profile";
import { UI } from "@/lib/ui-icons";
import { AxolArt, Modal, PrimaryButton, RarityTag, Stars, StatRow } from "./primitives";
import { CloseIcon, GameIcon } from "./GameIcon";

function AxolPick({
  axol,
  selected,
  onClick,
  tag,
}: {
  axol: Axol;
  selected?: boolean;
  onClick?: () => void;
  tag?: string;
}) {
  const color = CLASS_META[axol.cls].color;
  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-2xl border-2 bg-black/30 p-2 text-left transition hover:-translate-y-0.5"
      style={{
        borderColor: selected ? color : "rgba(255,255,255,0.12)",
        boxShadow: selected ? `0 0 0 2px ${color}, 0 0 18px ${color}99` : "none",
      }}
    >
      <div className="absolute right-2 top-1 text-[0.6rem] font-extrabold text-white/50">#{axol.id}</div>
      <div className="mx-auto" style={{ background: `radial-gradient(circle at 50% 35%, ${color}33, transparent 70%)` }}>
        <AxolArt axol={axol} size={84} float={false} />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-bold text-white">{CLASS_META[axol.cls].name}</span>
        <Stars rarity={axol.rarity} size="text-[0.6rem]" />
      </div>
      <div className="text-[0.6rem] text-white/50">Lv {axol.level} · Gen {axol.generation}</div>
      {tag && (
        <div className="mt-1 rounded-full px-2 py-0.5 text-center text-[0.55rem] font-extrabold" style={{ background: color, color: "#1a1030" }}>
          {tag}
        </div>
      )}
    </button>
  );
}

function RevealCard({ axol, headline }: { axol: Axol; headline: string }) {
  const color = CLASS_META[axol.cls].color;
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-black/30 p-5 animate-pop">
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
        {headline}
      </div>
      <div className="rounded-full p-2" style={{ boxShadow: `0 0 40px ${color}66` }}>
        <AxolArt axol={axol} size={150} />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-display text-xl font-extrabold text-white">
          {CLASS_META[axol.cls].name} #{axol.id}
        </span>
        <RarityTag rarity={axol.rarity} />
      </div>
      <Stars rarity={axol.rarity} size="text-lg" />
      <div className="mt-1 text-xs text-white/60">
        {axol.name} · Lv {axol.level} · Gen {axol.generation}
      </div>
      <div className="mt-2 w-full max-w-xs">
        <StatRow axol={axol} />
      </div>
    </div>
  );
}

// --------------------------- Roll / DNA ------------------------------------

export function RollModal({
  resources,
  onRoll,
  onClose,
}: {
  resources: Resources;
  onRoll: () => Promise<Axol | null>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Axol | null>(null);
  const afford = resources.dna >= COSTS.roll.dna && (resources.energy >= COSTS.roll.energy || resources.solax >= COSTS.roll.solax);

  const roll = async () => {
    setLoading(true);
    const a = await onRoll();
    setLoading(false);
    if (a) setResult(a);
  };

  return (
    <Modal iconSrc={UI.shrine} title="DNA Shrine" subtitle="Spin the gene pool for a brand-new Solaxy." onClose={onClose} maxW="max-w-lg">
      {result ? (
        <div className="space-y-4">
          <RevealCard axol={result} headline="A new Axol joins your pond!" />
          <div className="flex justify-center gap-3">
            <PrimaryButton variant="purple" onClick={roll} loading={loading} disabled={!afford}>
              Roll again
            </PrimaryButton>
            <button onClick={onClose} className="rounded-2xl border border-white/15 px-5 py-2.5 font-bold text-white/70 hover:bg-white/5">
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 py-2">
          <div className={`grid h-40 w-40 place-items-center rounded-full border-2 border-brand-400/60 ${loading ? "animate-spin" : "animate-pulseGlow"}`}>
            <img src="/icons/dna.png" alt="" className="h-24 w-24" />
          </div>
          <p className="text-center text-sm text-white/60">
            Each spin costs <b className="text-white">{COSTS.roll.dna} DNA</b> + <b className="text-white">{COSTS.roll.energy} energy</b> (or <b className="text-white">{COSTS.roll.solax.toLocaleString()} SOLAX</b> on-chain mint).
          </p>
          <PrimaryButton variant="purple" onClick={roll} loading={loading} disabled={!afford} className="px-10 text-lg">
            {afford ? (
              <span className="inline-flex items-center gap-2">
                <GameIcon src={UI.dna} size={20} /> Roll DNA
              </span>
            ) : (
              "Not enough resources"
            )}
          </PrimaryButton>
        </div>
      )}
    </Modal>
  );
}

// --------------------------- Breed (Nursery Tree) --------------------------

const FREE_BREEDS = 6;                       // free breeds per window (2 base + 4 launch gift)
const BREED_WINDOW_MS = 5 * 60 * 60 * 1000;  // breeds reset every 5 hours
const OVERRIDE_COST = 500_000;               // SOLAX to breed past the free limit

function breedWindow() {
  return Math.floor(Date.now() / BREED_WINDOW_MS);
}
function breedsKey() {
  return `solaxie_breeds_w_${breedWindow()}`;
}
function readBreedsUsed(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(breedsKey()) ?? "0") || 0;
}
function bumpBreedsUsed(): number {
  const n = readBreedsUsed() + 1;
  if (typeof window !== "undefined") window.localStorage.setItem(breedsKey(), String(n));
  return n;
}
function breedResetInMs(): number {
  return (breedWindow() + 1) * BREED_WINDOW_MS - Date.now();
}
function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

type BreedPhase = "idle" | "breeding" | "hatched";

export function BreedModal({
  axols,
  resources,
  onBreed,
  onClose,
}: {
  axols: Axol[];
  resources: Resources;
  onBreed: (a: number, b: number, solaxCost?: number) => Promise<Axol | null>;
  onClose: () => void;
}) {
  const breedable = axols.filter((a) => a.breedCount < a.maxBreedCount);
  const [aId, setAId] = useState<number | null>(breedable[0]?.id ?? null);
  const [bId, setBId] = useState<number | null>(breedable[1]?.id ?? null);
  const [picking, setPicking] = useState<"A" | "B" | null>(null);
  const [phase, setPhase] = useState<BreedPhase>("idle");
  const [child, setChild] = useState<Axol | null>(null);
  const [breedsUsed, setBreedsUsed] = useState(0);
  const [, setTick] = useState(0); // drives the live reset countdown
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setBreedsUsed(readBreedsUsed());
    const t = setInterval(() => { setTick((n) => n + 1); setBreedsUsed(readBreedsUsed()); }, 1000);
    return () => { clearInterval(t); timers.current.forEach(clearTimeout); };
  }, []);

  const parentA = axols.find((a) => a.id === aId) ?? null;
  const parentB = axols.find((a) => a.id === bId) ?? null;
  const ready = !!parentA && !!parentB && parentA.id !== parentB.id;

  const overLimit = breedsUsed >= FREE_BREEDS;
  const solaxCost = overLimit ? OVERRIDE_COST : 0;
  const afford = overLimit
    ? resources.solax >= OVERRIDE_COST && resources.eggs >= COSTS.breed.eggs
    : resources.eggs >= COSTS.breed.eggs;
  const resetMs = breedResetInMs();
  const canBreed = ready && afford && phase === "idle";

  const compat = ready ? breedCompatibility(parentA!, parentB!) : 0;
  const elements = ready ? possibleElements(parentA!, parentB!) : [];

  const pickParent = (slot: "A" | "B", id: number) => {
    sfx.click();
    if (slot === "A") {
      if (id === bId) setBId(aId);
      setAId(id);
    } else {
      if (id === aId) setAId(bId);
      setBId(id);
    }
    setPicking(null);
  };

  const startBreed = async () => {
    if (!canBreed || !parentA || !parentB) return;
    setPhase("breeding");
    sfx.breedCharge();
    timers.current.push(setTimeout(() => sfx.eggCrack(0), 700));
    timers.current.push(setTimeout(() => sfx.eggCrack(1), 980));
    timers.current.push(setTimeout(() => sfx.eggCrack(2), 1240));

    const c = await onBreed(parentA.id, parentB.id, solaxCost);
    if (!c) { setPhase("idle"); return; }

    timers.current.push(
      setTimeout(() => {
        sfx.hatch(c.rarity);
        setChild(c);
        setPhase("hatched");
        setBreedsUsed(bumpBreedsUsed());
      }, 1450),
    );
  };

  const reset = () => {
    setChild(null);
    setPhase("idle");
    // keep the same parents selected, but drop any that maxed out their breeds
    if (parentA && parentA.breedCount + 1 >= parentA.maxBreedCount) setAId(breedable.find((x) => x.id !== bId)?.id ?? null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={phase === "idle" ? onClose : undefined} />
      <div className="relative glass-strong w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 shadow-panel animate-pop sm:p-7">
        {/* close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* title */}
        <div className="mb-1 flex items-center justify-center gap-3">
          <GameIcon src={UI.blossom} size={24} glow="#ff7ad1" />
          <h2 className="font-display text-3xl font-extrabold tracking-wide text-white" style={{ textShadow: "0 0 18px rgba(255,95,176,0.35)" }}>NURSERY TREE</h2>
          <GameIcon src={UI.blossom} size={24} glow="#ff7ad1" />
        </div>
        <p className="mb-5 text-center text-sm text-white/55">Breed two Solaxies to hatch a new life.</p>

        {axols.length < 2 ? (
          <p className="py-12 text-center text-white/60">You need at least 2 Solaxies to breed. Roll some at the DNA Core first!</p>
        ) : phase === "hatched" && child ? (
          <HatchReveal child={child} onAgain={reset} onClose={onClose} />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
            <ParentSlot label="Parent A" axol={parentA} phase={phase} onPick={() => setPicking("A")} />
            <BreedingCore
              ready={ready}
              compat={compat}
              elements={elements}
              phase={phase}
              child={child}
              canBreed={canBreed}
              breedsUsed={breedsUsed}
              afford={afford}
              overLimit={overLimit}
              solaxCost={solaxCost}
              resetMs={resetMs}
              onBreed={startBreed}
              onReset={reset}
              onClose={onClose}
            />
            <ParentSlot label="Parent B" axol={parentB} phase={phase} onPick={() => setPicking("B")} />
          </div>
        )}

        {/* parent picker overlay */}
        {picking && (
          <ParentPicker
            axols={breedable}
            excludeId={picking === "A" ? bId : aId}
            currentId={picking === "A" ? aId : bId}
            slot={picking}
            onPick={(id) => pickParent(picking, id)}
            onClose={() => setPicking(null)}
          />
        )}
      </div>
    </div>
  );
}

function ParentSlot({ label, axol, phase, onPick }: { label: string; axol: Axol | null; phase: BreedPhase; onPick: () => void }) {
  const color = axol ? CLASS_META[axol.cls].color : "#a463ff";
  const breeding = phase !== "idle";
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-[0.66rem] font-extrabold uppercase tracking-[0.2em]" style={{ color: "#ff7ad1" }}>{label}</div>
      <button
        onClick={breeding ? undefined : onPick}
        className="group relative w-full overflow-hidden rounded-3xl border-2 p-4 text-center transition"
        style={{
          borderColor: `${color}99`,
          background: `radial-gradient(120% 80% at 50% 18%, ${color}22, rgba(0,0,0,0.35) 70%)`,
          boxShadow: `0 0 22px ${color}44, inset 0 0 28px ${color}1f`,
          cursor: breeding ? "default" : "pointer",
        }}
      >
        {axol ? (
          <>
            <span className="absolute left-3 top-3 z-10 rounded-lg bg-black/55 px-2 py-0.5 text-[0.62rem] font-extrabold text-white/70">#{axol.id}</span>
            <span className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full" style={{ background: `${color}33`, border: `1px solid ${color}88` }}>
              <img src={ELEMENT_ICON[axol.cls]} alt="" className="h-5 w-5 object-contain" draggable={false} />
            </span>

            <div className="relative mx-auto mt-2" style={{ height: 196 }}>
              {/* island */}
              <img src="/breed-platform.png" alt="" className="absolute bottom-0 left-1/2 w-[150px] -translate-x-1/2 object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.55)]" draggable={false} />
              {/* contact shadow on the grass */}
              <span className="absolute bottom-[54px] left-1/2 h-4 w-[72px] -translate-x-1/2 rounded-[50%] blur-md" style={{ background: "rgba(0,0,0,0.5)" }} />
              <span className="absolute bottom-[56px] left-1/2 h-5 w-[88px] -translate-x-1/2 rounded-[50%] blur-lg" style={{ background: `${color}55` }} />
              {/* creature standing on the grass — wrapper centers, inner img bobs
                  (keeping the bob's translateY off the element that holds -translate-x-1/2) */}
              <div className="absolute bottom-[60px] left-1/2 z-10 h-[124px] w-[186px] -translate-x-1/2">
                <img
                  src={axolSprite(axol)}
                  alt=""
                  className={`h-full w-full object-contain object-bottom ${breeding ? "" : "animate-bob"}`}
                  style={{ filter: `drop-shadow(0 6px 8px rgba(0,0,0,0.45)) drop-shadow(0 0 16px ${color}66)` }}
                  draggable={false}
                />
              </div>
            </div>

            <div className="mt-1 font-display text-xl font-extrabold text-white">{CLASS_META[axol.cls].name} #{axol.id}</div>
            <div className="text-[0.72rem] text-white/55">Lv.{axol.level} · Gen {axol.generation}</div>
            <div className="mt-1.5 flex justify-center"><Stars rarity={axol.rarity} size="text-sm" /></div>
            {!breeding && <div className="mt-2 text-[0.58rem] font-bold uppercase tracking-wide text-white/30 transition group-hover:text-white/60">Tap to change</div>}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-white/25 text-3xl text-white/40">+</span>
            <span className="text-sm font-bold text-white/55">Select {label}</span>
          </div>
        )}
      </button>
    </div>
  );
}

function BreedingCore({
  ready,
  compat,
  elements,
  phase,
  child,
  canBreed,
  breedsUsed,
  afford,
  overLimit,
  solaxCost,
  resetMs,
  onBreed,
  onReset,
  onClose,
}: {
  ready: boolean;
  compat: number;
  elements: AxolClass[];
  phase: BreedPhase;
  child: Axol | null;
  canBreed: boolean;
  breedsUsed: number;
  afford: boolean;
  overLimit: boolean;
  solaxCost: number;
  resetMs: number;
  onBreed: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  // animated count-up for compatibility
  const [shownCompat, setShownCompat] = useState(0);
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    const start = performance.now();
    const from = shownCompat;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      setShownCompat(Math.round(from + (compat - from) * t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compat, ready]);

  useEffect(() => {
    if (ready && phase === "idle") sfx.heartbeat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compat, ready]);

  if (child && phase === "hatched") {
    return null;
  }

  const compatColor = compat >= 85 ? "#54e07a" : compat >= 70 ? "#ffb02e" : "#ff6b6b";

  return (
    <div className="flex flex-col items-center">
      {/* compatibility */}
      <div className="flex flex-col items-center">
        <GameIcon src={UI.heart} size={28} className="animate-heartpulse" glow="rgba(255,95,176,0.7)" />
        <span className="mt-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-white/45">Compatibility</span>
        <span className="font-display text-3xl font-extrabold" style={{ color: ready ? compatColor : "rgba(255,255,255,0.3)", textShadow: ready ? `0 0 18px ${compatColor}66` : "none" }}>
          {ready ? `${shownCompat}%` : "—"}
        </span>
      </div>

      {/* egg + arcs */}
      <div className="relative my-1 h-[210px] w-full">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 210" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="arcL" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff5fb0" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ff5fb0" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="arcR" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#54e07a" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#54e07a" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d="M-30 40 Q 90 70 150 140" stroke="url(#arcL)" strokeWidth="2.5" strokeDasharray="4 7" strokeLinecap="round" className={ready ? "animate-dashflow" : ""} opacity={ready ? 1 : 0.25} />
          <path d="M330 40 Q 210 70 150 140" stroke="url(#arcR)" strokeWidth="2.5" strokeDasharray="4 7" strokeLinecap="round" className={ready ? "animate-dashflow" : ""} opacity={ready ? 1 : 0.25} />
        </svg>

        {/* little hearts on the arcs */}
        {ready && (
          <>
            <GameIcon src={UI.heart} size={12} className="absolute left-[24%] top-[34%] animate-heartpulse" glow="#ff5fb0" style={{ animationDelay: "0.2s" }} />
            <GameIcon src={UI.heart} size={12} className="absolute right-[24%] top-[34%] animate-heartpulse" glow="#54e07a" style={{ animationDelay: "0.5s" }} />
          </>
        )}

        {/* aura */}
        <span className="absolute left-1/2 top-[58%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" style={{ background: phase === "breeding" ? "rgba(196,107,255,0.55)" : "rgba(160,99,255,0.3)" }} />
        {/* egg */}
        <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2">
          <img
            src="/breed-egg.png"
            alt=""
            className={`h-[180px] w-[180px] object-contain ${phase === "breeding" ? "animate-eggrattle" : "animate-eggwobble"}`}
            style={{ filter: phase === "breeding" ? "drop-shadow(0 0 40px rgba(196,107,255,0.95)) brightness(1.2)" : "drop-shadow(0 10px 16px rgba(0,0,0,0.5)) drop-shadow(0 0 22px rgba(160,99,255,0.5))" }}
            draggable={false}
          />
          {phase === "breeding" && (
            <>
              <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-burstpop rounded-full border-2 border-fuchsia-300/70" />
              <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-burstpop rounded-full border-2 border-cyan-300/60" style={{ animationDelay: "0.2s" }} />
            </>
          )}
        </div>
      </div>

      {/* possible elements */}
      <div className="mb-1 text-[0.58rem] font-extrabold uppercase tracking-[0.18em] text-white/45">Possible Elements</div>
      <div className="mb-3 flex items-center justify-center gap-3">
        {(ready ? elements : []).map((c) => (
          <div key={c} className="flex flex-col items-center gap-1">
            <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: `${CLASS_META[c].color}22`, border: `1.5px solid ${CLASS_META[c].color}88` }}>
              <img src={CLASS_META[c].sprite} alt="" className="h-8 w-8 object-contain" draggable={false} />
            </span>
            <span className="text-[0.56rem] font-bold text-white/55">{CLASS_META[c].name}</span>
          </div>
        ))}
        {!ready && <span className="text-[0.7rem] text-white/35">Select two parents to preview</span>}
      </div>

      {/* cost + breed */}
      <div className="mt-1 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
        <div className={`flex items-center gap-3 whitespace-nowrap rounded-2xl border px-4 py-2.5 ${afford ? (overLimit ? "border-amber-300/40 bg-amber-400/10" : "border-white/10 bg-black/30") : "border-rose-400/40 bg-rose-500/10"}`}>
          <span className="text-[0.54rem] font-extrabold uppercase tracking-[0.16em] text-white/40">{overLimit ? "Unlock" : "Cost"}</span>
          <span className="flex items-center gap-1.5">
            <img src="/icons/coin.png" alt="" className="h-5 w-5" />
            <b className="font-display text-[0.95rem]" style={{ color: overLimit ? "#ffd24a" : "#fff" }}>
              {overLimit ? solaxCost.toLocaleString() : "FREE"}
            </b>
            {overLimit ? <span className="text-[0.6rem] font-bold uppercase tracking-wide text-white/45">SOLAX</span> : null}
          </span>
          <span className="text-white/25">+</span>
          <span className="flex items-center gap-1.5">
            <img src="/icons/egg.png" alt="" className="h-5 w-5" />
            <b className="font-display text-[0.95rem] text-white">{COSTS.breed.eggs}</b>
            <span className="text-[0.6rem] font-bold uppercase tracking-wide text-white/45">egg</span>
          </span>
        </div>
        <button
          onClick={onBreed}
          disabled={!canBreed}
          className={`group relative flex min-w-[200px] items-center justify-center gap-2 overflow-hidden rounded-2xl px-7 py-3.5 font-display text-base font-extrabold uppercase tracking-wide text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0 ${
            overLimit
              ? "bg-gradient-to-r from-[#ff9d1f] via-[#ff5fb0] to-[#d63cff] shadow-[0_10px_30px_rgba(255,157,31,0.5)]"
              : "bg-gradient-to-r from-[#a13bff] via-[#d63cff] to-[#ff5fb0] shadow-[0_10px_30px_rgba(214,60,255,0.55)]"
          }`}
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
          {phase === "breeding" ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Hatching…</>
          ) : overLimit ? (
            <><GameIcon src={UI.energy} size={20} /> Breed Again</>
          ) : (
            <><GameIcon src={UI.blossom} size={20} /> Breed <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[0.72rem]">{breedsUsed}/{FREE_BREEDS}</span></>
          )}
        </button>
      </div>
      <p className={`mt-2.5 text-center text-[0.7rem] font-semibold ${!afford ? "text-rose-300" : overLimit ? "text-amber-300" : "text-white/45"}`}>
        {!afford
          ? overLimit
            ? `Need ${OVERRIDE_COST.toLocaleString()} SOLAX and 1 egg to breed again.`
            : "Need 1 egg to breed."
          : overLimit
          ? `Free breeds used — pay ${OVERRIDE_COST.toLocaleString()} SOLAX to breed now. Free breeds reset in ${fmtCountdown(resetMs)}.`
          : `${FREE_BREEDS - breedsUsed} free breed(s) left · resets in ${fmtCountdown(resetMs)}.`}
      </p>
    </div>
  );
}

function HatchReveal({ child, onAgain, onClose }: { child: Axol; onAgain: () => void; onClose: () => void }) {
  const color = CLASS_META[child.cls].color;
  const rc = RARITY_META[child.rarity].color;
  const epicPlus = RARITY_META[child.rarity].stars >= 3;
  const primary = axolSprite(child);
  const fallback = axolClassSprite(child);
  const [spriteSrc, setSpriteSrc] = useState(primary);
  useEffect(() => setSpriteSrc(primary), [primary]);
  return (
    <div className="relative flex flex-col items-center">
      <span className="pointer-events-none absolute inset-0 animate-flashout rounded-3xl bg-white" />
      {epicPlus && (
        <>
          {Array.from({ length: 14 }).map((_, i) => (
            <GameIcon
              key={i}
              src={UI.heart}
              size={14}
              className="pointer-events-none absolute top-1/3 animate-risefade"
              glow={i % 2 ? rc : "#ff5fb0"}
              style={{ left: `${10 + (i * 6) % 80}%`, animationDelay: `${(i % 6) * 0.12}s` }}
            />
          ))}
        </>
      )}

      <div className="relative z-10 mb-1 animate-bannerin rounded-full px-5 py-1 font-display text-lg font-extrabold text-white" style={{ background: `linear-gradient(90deg, ${rc}, #ffffff44, ${rc})`, boxShadow: `0 0 24px ${rc}` }}>
        {child.rarity === "Cosmic" ? (
          <span className="inline-flex items-center gap-2"><GameIcon src={UI.cosmic} size={22} /> COSMIC HATCH!</span>
        ) : (
          `Gen ${child.generation} Hatched!`
        )}
      </div>

      <div className="relative z-10 my-1 flex gap-1">
        {Array.from({ length: RARITY_META[child.rarity].stars }).map((_, i) => (
          <span key={i} className="animate-starpop text-xl" style={{ color: rc, animationDelay: `${0.25 + i * 0.1}s`, textShadow: `0 0 10px ${rc}` }}>★</span>
        ))}
      </div>

      <div className="relative z-10 grid place-items-center">
        <span className="absolute h-44 w-44 rounded-full blur-3xl" style={{ background: `${color}66` }} />
        <img
          src={spriteSrc}
          alt=""
          className="relative h-44 w-44 animate-slamin object-contain"
          draggable={false}
          style={{ filter: `drop-shadow(0 0 22px ${color}) drop-shadow(0 12px 14px rgba(0,0,0,0.6))` }}
          onError={() => { if (spriteSrc !== fallback) setSpriteSrc(fallback); }}
        />
        <span className="absolute -right-1 top-1 animate-starpop rounded-full bg-rose-500 px-2 py-0.5 text-[0.58rem] font-extrabold text-white" style={{ animationDelay: "0.5s" }}>NEW!</span>
      </div>

      <div className="relative z-10 mt-1 font-display text-xl font-extrabold text-white">{CLASS_META[child.cls].name} #{child.id}</div>
      <div className="relative z-10 text-[0.72rem] font-bold" style={{ color: rc }}>{child.name} · Lv.{child.level} · Gen {child.generation}</div>

      <div className="relative z-10 mt-3 w-full max-w-xs"><StatRow axol={child} /></div>

      <div className="relative z-10 mt-4 flex gap-3">
        <PrimaryButton variant="pink" onClick={onAgain}>Breed again</PrimaryButton>
        <button onClick={onClose} className="rounded-2xl border border-white/15 px-5 py-2.5 font-bold text-white/70 transition hover:bg-white/5">Done</button>
      </div>
    </div>
  );
}

function ParentPicker({ axols, excludeId, currentId, slot, onPick, onClose }: { axols: Axol[]; excludeId: number | null; currentId: number | null; slot: "A" | "B"; onPick: (id: number) => void; onClose: () => void }) {
  const list = axols.filter((a) => a.id !== excludeId);
  return (
    <div className="absolute inset-0 z-40 flex flex-col rounded-3xl bg-ink-900/95 p-5 backdrop-blur animate-fade">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-extrabold text-white">Choose Parent {slot}</h3>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10" aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      {list.length === 0 ? (
        <p className="py-10 text-center text-white/55">No other eligible Solaxies. Breed creatures that still have breeds left.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
          {list.map((a) => (
            <AxolPick key={a.id} axol={a} selected={a.id === currentId} onClick={() => onPick(a.id)} tag={`${a.maxBreedCount - a.breedCount} breeds left`} />
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------- Battle ----------------------------------------

export function BattleModal({
  axols,
  resources,
  onBattle,
  onClose,
}: {
  axols: Axol[];
  resources: Resources;
  onBattle: (myId: number) => Promise<{ mine: Axol; enemy: Axol; result: BattleResult } | null>;
  onClose: () => void;
}) {
  const [myId, setMyId] = useState<number | null>(axols[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<{ mine: Axol; enemy: Axol; result: BattleResult } | null>(null);
  const afford = resources.energy >= COSTS.battle.energy;

  const fight = async () => {
    if (myId === null) return;
    setLoading(true);
    const o = await onBattle(myId);
    setLoading(false);
    if (o) setOutcome(o);
  };

  return (
    <Modal iconSrc={UI.arena} title="Arena Cave" subtitle="Send a Solaxy to battle a wild challenger." onClose={onClose} maxW="max-w-3xl">
      {outcome ? (
        <div className="space-y-4">
          <div
            className="rounded-2xl py-3 text-center font-display text-2xl font-extrabold animate-pop"
            style={{
              background: outcome.result.win ? "linear-gradient(90deg,#2fe0a0,#2fa0e0)" : "linear-gradient(90deg,#ff4d4d,#ff2d7a)",
              color: "white",
            }}
          >
            {outcome.result.win ? (
              <span className="inline-flex items-center justify-center gap-2"><GameIcon src={UI.victory} size={28} /> VICTORY!</span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2"><GameIcon src={UI.defeat} size={28} /> DEFEAT</span>
            )}
          </div>
          <div className="flex items-center justify-center gap-4">
            <BattleSide axol={outcome.mine} roll={outcome.result.myRoll} highlight={outcome.result.advantage === "you"} />
            <span className="font-display text-3xl font-extrabold text-white/40">VS</span>
            <BattleSide axol={outcome.enemy} roll={outcome.result.enemyRoll} highlight={outcome.result.advantage === "enemy"} enemy />
          </div>
          <p className="text-center text-sm text-white/70">
            {outcome.result.advantage === "you" && "Type advantage in your favor! "}
            {outcome.result.advantage === "enemy" && "Enemy had the type advantage. "}
            You earned{" "}
            {outcome.result.win && <><b className="text-white">+5 DNA</b>, </>}
            <b className="text-white">+{outcome.result.rewardXp} XP</b>
            {outcome.result.win && <>, and <b className="text-amber-200">activity tickets</b></>}.
          </p>
          <div className="flex justify-center gap-3">
            <PrimaryButton variant="red" onClick={() => setOutcome(null)} disabled={!afford}>
              Battle again
            </PrimaryButton>
            <button onClick={onClose} className="rounded-2xl border border-white/15 px-5 py-2.5 font-bold text-white/70 hover:bg-white/5">
              Done
            </button>
          </div>
        </div>
      ) : axols.length === 0 ? (
        <p className="py-8 text-center text-white/60">You need an Axol to battle. Roll one at the DNA Shrine!</p>
      ) : (
        <>
          <p className="mb-2 text-sm font-bold text-white">Choose your fighter</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {axols.map((a) => (
              <AxolPick key={a.id} axol={a} selected={myId === a.id} onClick={() => setMyId(a.id)} />
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-white/60">
              Cost: <b className="inline-flex items-center gap-1 text-white">{COSTS.battle.energy} <GameIcon src={UI.energy} size={16} /> energy</b>
            </span>
            <PrimaryButton variant="red" onClick={fight} loading={loading} disabled={myId === null || !afford}>
              {afford ? (
                <span className="inline-flex items-center gap-2"><GameIcon src={UI.sword} size={18} /> Find & Fight</span>
              ) : (
                "Out of energy"
              )}
            </PrimaryButton>
          </div>
        </>
      )}
    </Modal>
  );
}

function BattleSide({ axol, roll, highlight, enemy }: { axol: Axol; roll: number; highlight?: boolean; enemy?: boolean }) {
  const color = CLASS_META[axol.cls].color;
  return (
    <div className="flex w-32 flex-col items-center">
      <div className="rounded-full" style={{ boxShadow: highlight ? `0 0 26px ${color}` : "none" }}>
        <AxolArt axol={axol} size={108} float={false} />
      </div>
      <div className="text-sm font-bold text-white">{enemy ? axol.name : `${CLASS_META[axol.cls].name} #${axol.id}`}</div>
      <Stars rarity={axol.rarity} size="text-xs" />
      <div className="mt-1 rounded-full bg-black/40 px-3 py-0.5 font-display text-lg font-extrabold" style={{ color }}>
        {roll}
      </div>
    </div>
  );
}

// --------------------------- Market ----------------------------------------

export function MarketModal({
  resources,
  onBuy,
  onClose,
}: {
  resources: Resources;
  onBuy: (item: "egg" | "energy" | "dna") => boolean;
  onClose: () => void;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const items: { key: "egg" | "energy" | "dna"; name: string; icon: string; price: number; desc: string }[] = [
    { key: "egg", name: "Breeding Egg", icon: "/icons/egg.png", price: 1400, desc: "+1 egg for the nursery" },
    { key: "dna", name: "DNA Bundle", icon: "/icons/dna.png", price: 850, desc: "+5 DNA for rolls" },
    { key: "energy", name: "Energy Refill", icon: "/icons/coin.png", price: 1050, desc: "Restore energy to full" },
  ];
  const buy = (k: "egg" | "energy" | "dna", name: string) => {
    const ok = onBuy(k);
    setMsg(ok ? `Purchased ${name}!` : "Not enough SOLAX.");
    setTimeout(() => setMsg(null), 1800);
  };
  return (
    <Modal iconSrc={UI.market} title="Harbor Market" subtitle="Spend SOLAX on supplies. Player trading — Version 1.3." onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.key} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
            <img src={it.icon} alt="" className="h-14 w-14 object-contain" />
            <div className="font-bold text-white">{it.name}</div>
            <div className="text-[0.7rem] text-white/50">{it.desc}</div>
            <PrimaryButton variant="green" onClick={() => buy(it.key, it.name)} disabled={resources.solax < it.price} className="mt-1 text-sm">
              {it.price} SOLAX
            </PrimaryButton>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-4 text-center text-sm text-white/50">
        🪙 Player-to-player Solaxy trading — coming in Version 1.3.
      </div>
      {msg && (
        <div className="mt-3 rounded-xl bg-brand-400/20 py-2 text-center text-sm font-bold text-brand-300 animate-fade">{msg}</div>
      )}
    </Modal>
  );
}

// --------------------------- Empire / Leaderboard --------------------------

export function EmpireModal({ axols, onClose }: { axols: Axol[]; onClose: () => void }) {
  const myPower = Math.round(axols.reduce((s, a) => s + a.attack + a.defense + a.hp * 0.25, 0));
  const board = [
    { name: "luna.sol", power: 152840, you: false },
    { name: "james.sol", power: 121300, you: false },
    { name: "you", power: 90000 + myPower, you: true },
    { name: "sarah.sol", power: 78250, you: false },
    { name: "mike.sol", power: 64120, you: false },
  ].sort((a, b) => b.power - a.power);

  return (
    <Modal iconSrc={UI.empire} title="Solaxy Empire" subtitle="Guild leaderboard — climb the ranks this season." onClose={onClose} maxW="max-w-lg">
      <div className="space-y-2">
        {board.map((row, i) => (
          <div
            key={row.name}
            className="flex items-center gap-3 rounded-2xl border px-4 py-3"
            style={{
              borderColor: row.you ? "rgba(138,55,255,0.6)" : "rgba(255,255,255,0.1)",
              background: row.you ? "rgba(138,55,255,0.14)" : "rgba(0,0,0,0.25)",
            }}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-black/40 font-display font-extrabold text-white">
              {i + 1}
            </div>
            <div className="flex-1 font-bold text-white">
              {row.name} {row.you && <span className="text-brand-300">(you)</span>}
            </div>
            <div className="font-display font-extrabold text-white/80">{row.power.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-white/50">Your collection power: <b className="text-white">{myPower.toLocaleString()}</b></div>
    </Modal>
  );
}

// --------------------------- Collection ------------------------------------

export function CollectionModal({ axols, onClose }: { axols: Axol[]; onClose: () => void }) {
  return (
    <Modal iconSrc={UI.collection} title="Collection" subtitle={`${axols.length} Solaxies in your pond`} onClose={onClose} maxW="max-w-3xl">
      {axols.length === 0 ? (
        <p className="py-8 text-center text-white/60">No Axols yet — roll one at the DNA Shrine!</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {axols.map((a) => (
            <AxolPick key={a.id} axol={a} />
          ))}
        </div>
      )}
    </Modal>
  );
}

/** First-login gate — player must pick a trainer name before playing. */
export function UsernameModal({
  onSubmit,
}: {
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const err = validateUsername(value);
    if (err) {
      setError(err);
      return;
    }
    sfx.click();
    onSubmit(formatTrainerName(value));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative glass-strong w-full max-w-md rounded-3xl p-6 shadow-panel animate-pop">
        <div className="flex flex-col items-center text-center">
          <img src="/avatar-axolotl.png" alt="" className="h-20 w-20 rounded-full ring-4 ring-brand-400/40" draggable={false} />
          <h2 className="mt-4 font-display text-2xl font-extrabold text-white">Choose Your Name</h2>
          <p className="mt-2 text-sm text-white/60">
            Welcome, Trainer! Pick a name for the global live feed — everyone on Solaxie will see your adventures.
          </p>
        </div>
        <div className="mt-5">
          <label className="mb-1.5 block text-left text-[0.65rem] font-extrabold uppercase tracking-widest text-brand-200/80">
            Trainer name
          </label>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="luna"
            maxLength={16}
            className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 font-display text-lg font-extrabold text-white outline-none placeholder:text-white/25"
          />
          {error ? <p className="mt-2 text-left text-xs font-bold text-rose-400">{error}</p> : (
            <p className="mt-2 text-left text-[0.65rem] text-white/40">3–16 characters · shown in Live Feed worldwide</p>
          )}
        </div>
        <PrimaryButton className="mt-5 w-full" onClick={submit} disabled={value.trim().length < 3}>
          Enter the Pond
        </PrimaryButton>
      </div>
    </div>
  );
}
