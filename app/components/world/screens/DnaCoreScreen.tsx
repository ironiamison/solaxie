import { useEffect, useMemo, useState } from "react";
import { Axol, CLASS_META, COSTS, DNA_BONUS, ENERGY_REFILL, RARITY_META, RARITY_ORDER, Rarity, axolSprite, dnaBonusRemaining, energyRefillCost, formatCooldown } from "@/lib/game";
import { UI } from "@/lib/ui-icons";
import { sfx } from "@/lib/sfx";
import type { WorldApi } from "../world";
import { Panel, ScreenShell, ScreenTop, SectionTitle } from "../ScreenChrome";
import { Stars } from "../primitives";
import { GameIcon } from "../GameIcon";

const BOOSTERS = [
  { id: "luck", name: "Lucky Charm", note: "+10% Luck", icon: UI.clover, cost: 10, color: "#54e07a", luck: 0.1 },
  { id: "epic", name: "Epic Booster", note: "+20% Epic", icon: UI.gemEpic, cost: 20, color: "#a779ff", luck: 0.15 },
  { id: "legend", name: "Legendary Booster", note: "+15% Legendary", icon: UI.flame, cost: 30, color: "#ffb02e", luck: 0.2 },
  { id: "cosmic", name: "Cosmic Booster", note: "+10% Cosmic", icon: UI.cosmic, cost: 50, color: "#c46bff", luck: 0.25 },
];

// Per-rarity reveal intensity — the dopamine dial.
const TIER: Record<Rarity, { label: string; color: string; confetti: number; shake: boolean; tag: string }> = {
  Common: { label: "COMMON", color: "#9aa4b2", confetti: 0, shake: false, tag: "A new friend!" },
  Rare: { label: "RARE!", color: "#3db4ff", confetti: 22, shake: false, tag: "Nice pull!" },
  Epic: { label: "EPIC!", color: "#a779ff", confetti: 48, shake: false, tag: "Big find!" },
  Legendary: { label: "LEGENDARY!", color: "#ffb02e", confetti: 90, shake: true, tag: "Incredible!" },
  Cosmic: { label: "✦ COSMIC ✦", color: "#c46bff", confetti: 150, shake: true, tag: "ONE IN A HUNDRED!" },
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function DnaBonusPanel({ world }: { world: WorldApi }) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = dnaBonusRemaining(world.lastDnaBonusAt, now);
  const ready = remaining <= 0;

  useEffect(() => {
    if (ready) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [ready, world.lastDnaBonusAt]);

  return (
    <Panel className="flex items-center gap-3 p-4">
      <div className="relative shrink-0">
        <GameIcon src={UI.gift} size={36} />
        {ready && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-ink-900" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-extrabold text-white">Free DNA Bonus</div>
        <p className="text-[0.62rem] text-white/55">
          {ready
            ? `Claim +${DNA_BONUS.amount} DNA — available every 4 hours.`
            : `Next claim in ${formatCooldown(remaining)}`}
        </p>
      </div>
      <button
        onClick={() => world.claimDnaBonus()}
        disabled={!ready}
        className="rounded-full bg-gradient-to-r from-[#8a37ff] to-[#d63cff] px-3 py-1.5 text-[0.7rem] font-extrabold text-white shadow-glow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {ready ? "CLAIM" : formatCooldown(remaining)}
      </button>
    </Panel>
  );
}

export default function DnaCoreScreen({ world }: { world: WorldApi }) {
  const [phase, setPhase] = useState<"idle" | "charging" | "revealed">("idle");
  const [results, setResults] = useState<Axol[]>([]);
  const [lastCount, setLastCount] = useState(1);
  const [boosts, setBoosts] = useState<Record<string, boolean>>({});

  const luck = BOOSTERS.reduce((s, b) => (boosts[b.id] ? s + b.luck : s), 0);
  /** On-chain mint only when chain is live AND wallet has enough SOLAX; otherwise DNA spin. */
  const onChainMint = world.chainReady && world.resources.solax >= COSTS.roll.solax;

  async function spin(count: number) {
    if (phase === "charging") return;

    try {
      sfx.startAmbient();
      sfx.click();

      const activeBoosters = BOOSTERS.filter((b) => boosts[b.id]);
      let dnaBoostCost = 0;
      const consumeKeys: string[] = [];
      for (const b of activeBoosters) {
        const owned = world.resources.items?.[b.id] ?? 0;
        if (owned > 0) consumeKeys.push(b.id);
        else dnaBoostCost += b.cost;
      }

      if (onChainMint) {
        if (world.resources.solax < COSTS.roll.solax * count) {
          world.toast(`Need ${(COSTS.roll.solax * count).toLocaleString()} SOLAX in wallet`, { critical: true });
          return;
        }
      } else {
        const dnaNeed = count * COSTS.roll.dna + dnaBoostCost;
        const energyNeed = count * COSTS.roll.energy;
        if (world.resources.dna < dnaNeed) {
          world.toast(
            dnaBoostCost > 0 ? `Need ${dnaNeed} DNA (includes boosters)` : `Need ${dnaNeed} DNA to spin`,
            { critical: true },
          );
          return;
        }
        if (world.resources.energy < energyNeed) {
          world.toast("Out of energy — refill below to keep spinning", { critical: true });
          return;
        }
      }

      setLastCount(count);
      setPhase("charging");
      setResults([]);
      sfx.charge();
      const t0 = Date.now();
      const got: Axol[] = [];
      for (let i = 0; i < count; i++) {
        const a = await world.doRoll(luck);
        if (a) got.push(a);
        else break;
      }
      const wait = Math.max(0, 1250 - (Date.now() - t0));
      if (wait) await delay(wait);
      if (got.length === 0) {
        setPhase("idle");
        world.toast(onChainMint ? "Mint failed or cancelled" : "Spin failed — check DNA & energy", { critical: true });
        return;
      }

      if (dnaBoostCost > 0) world.spendDna(dnaBoostCost);
      if (consumeKeys.length > 0) world.consumeHarborItems(consumeKeys);

      const best = got.reduce((a, b) => (RARITY_META[b.rarity].stars > RARITY_META[a.rarity].stars ? b : a), got[0]);
      setResults(got);
      setPhase("revealed");
      sfx.reveal(best.rarity);
      setBoosts({});
    } catch (e) {
      console.error("[spin]", e);
      setPhase("idle");
      world.toast(e instanceof Error ? e.message : "Spin failed — try again", { critical: true });
    }
  }

  async function refill(blocks: number) {
    if (blocks <= 0) { world.toast("Energy already full"); return; }
    if (await world.buyEnergy(blocks)) {
      sfx.coin();
      world.toast(`+${blocks * ENERGY_REFILL.perBlock} energy · −${(blocks * ENERGY_REFILL.solaxPerBlock).toLocaleString()} SOLAX burned`);
    } else {
      world.toast(`Need ${(blocks * ENERGY_REFILL.solaxPerBlock).toLocaleString()} SOLAX in wallet`);
    }
  }

  function addToPond() {
    if (results.length === 0) return;
    const best = results.reduce((a, b) => (RARITY_META[b.rarity].stars > RARITY_META[a.rarity].stars ? b : a), results[0]);
    world.setSelectedId(best.id);
    world.setActive(best.id);
    world.setScreen("home");
    world.toast(`${best.rarity} ${CLASS_META[best.cls].name} added to your pond!`);
    setPhase("idle");
    setResults([]);
  }

  function closeReveal() {
    setPhase("idle");
    setResults([]);
  }

  return (
    <ScreenShell bg="/dna-core-bg.png" dark={0.5}>
      <ScreenTop world={world} title="DNA CORE" subtitle="Unlock life. Reveal destiny." icon="/icon-shrine.png" />

      <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-3 px-3 pb-28 sm:px-5">
        {/* Left rail */}
        <aside className="col-span-12 space-y-3 lg:col-span-3">
          <Panel className="p-4">
            <div className="flex items-center gap-2">
              <GameIcon src={UI.dna} size={28} glow="#c08bff" />
              <SectionTitle accent="#c08bff">DNA Core</SectionTitle>
            </div>
            <p className="mt-2 text-[0.74rem] leading-snug text-white/65">The heart of Solaxie life. Combine DNA strands, awaken new Solaxies, and create legendary beings.</p>
            <button className="mt-3 w-full rounded-full border border-white/15 bg-white/5 py-2 text-[0.74rem] font-bold text-white/80 transition hover:bg-white/10">▶ How it works</button>
          </Panel>

          <Panel className="p-4">
            <SectionTitle accent="#c08bff">Possible Rarities</SectionTitle>
            <div className="mt-2 space-y-1.5">
              {RARITY_ORDER.slice().reverse().map((r) => (
                <div key={r} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: RARITY_META[r].color, boxShadow: `0 0 8px ${RARITY_META[r].color}` }} />
                    <span style={{ color: RARITY_META[r].color }} className="font-semibold">{r}</span>
                  </span>
                  <span className="font-bold text-white/70">{RARITY_META[r].odds}%</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="flex items-center justify-between p-4">
            <div>
              <SectionTitle accent="#c08bff">DNA Strands</SectionTitle>
              <div className="mt-1 flex items-center gap-2">
                <GameIcon src={UI.dna} size={24} />
                <span className="font-display text-2xl font-extrabold text-white">{world.resources.dna}</span>
              </div>
              <p className="mt-1 text-[0.62rem] text-white/45">Earn more from battles and events!</p>
            </div>
            <button onClick={() => world.setScreen("market")} className="grid h-9 w-9 place-items-center rounded-full bg-brand-500/40 text-lg text-white hover:bg-brand-500/60">+</button>
          </Panel>

          <DnaBonusPanel world={world} />
        </aside>

        {/* Center chamber */}
        <section className="col-span-12 flex flex-col items-center lg:col-span-6">
          <div className="mt-1 rounded-2xl border border-brand-400/40 bg-ink-900/55 px-5 py-2 text-center backdrop-blur">
            <div className="font-display text-xl font-extrabold tracking-wide text-fuchsia-300" style={{ textShadow: "0 0 16px rgba(196,107,255,0.7)" }}>✦ COSMIC AXOL ✦</div>
            <div className="text-[0.7rem] text-white/60">New possibilities await...</div>
          </div>

          {/* the pod / charging stage */}
          <div className="relative my-3 grid w-full flex-1 place-items-center" style={{ minHeight: "44vh" }}>
            <ChamberStage phase={phase} />
          </div>

          {/* luck boost */}
          <div className="flex w-full max-w-md items-center gap-2 px-2">
            <span className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-emerald-300">
              <GameIcon src={UI.clover} size={14} /> Luck Boost +{Math.round(luck * 100)}%
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/50">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-brand-400 transition-all" style={{ width: `${Math.min(100, 25 + luck * 100)}%` }} />
            </div>
            <GameIcon src={UI.boost} size={18} className="opacity-80" />
          </div>

          {/* energy + refill */}
          <div className="mt-3 w-full max-w-xl px-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5">
              <img src="/icon-energy.png" alt="" className="h-6 w-6 object-contain" />
              <div className="flex-1">
                <div className="flex justify-between text-[0.58rem] font-bold uppercase tracking-wide text-white/55">
                  <span>Energy</span>
                  <span>{world.resources.energy}/{world.resources.maxEnergy} · {Math.floor(world.resources.energy / COSTS.roll.energy)} spins left</span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-black/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-500 transition-all"
                    style={{ width: `${Math.max(0, (world.resources.energy / world.resources.maxEnergy) * 100)}%` }}
                  />
                </div>
              </div>
              {world.resources.energy < world.resources.maxEnergy && (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => refill(1)}
                    className="flex flex-col items-center rounded-xl border border-amber-300/40 bg-amber-400/10 px-2.5 py-1.5 text-amber-200 transition hover:bg-amber-400/20"
                  >
                    <span className="text-[0.66rem] font-extrabold">+10</span>
                    <span className="text-[0.5rem] font-bold text-white/55">100k</span>
                  </button>
                  <button
                    onClick={() => refill(Math.ceil((world.resources.maxEnergy - world.resources.energy) / ENERGY_REFILL.perBlock))}
                    className="flex flex-col items-center rounded-xl border border-amber-300/50 bg-gradient-to-b from-amber-400/25 to-amber-500/15 px-2.5 py-1.5 text-amber-100 transition hover:from-amber-400/35"
                  >
                    <span className="text-[0.66rem] font-extrabold">Full</span>
                    <span className="text-[0.5rem] font-bold text-white/60">{energyRefillCost(world.resources.maxEnergy - world.resources.energy).toLocaleString()}</span>
                  </button>
                </div>
              )}
            </div>
            {onChainMint ? (
              <p className="mt-1.5 text-center text-[0.64rem] font-semibold text-amber-300">
                On-chain mint · {COSTS.roll.solax.toLocaleString()} SOLAX per Solaxy · energy from your player account
              </p>
            ) : world.resources.energy < COSTS.roll.energy ? (
              <p className="mt-1.5 text-center text-[0.64rem] font-semibold text-amber-300">Out of energy — refill to keep spinning (100k SOLAX per 10 energy).</p>
            ) : null}
          </div>

          {/* spin buttons — pt-2 gives room for the 10× discount badge above the button */}
          <div className="mt-3 flex w-full max-w-xl gap-3 overflow-visible px-2 pt-2">
            <button
              onClick={() => spin(1)}
              disabled={phase === "charging" || (!onChainMint && world.resources.energy < COSTS.roll.energy)}
              className="group relative flex flex-1 flex-col items-center rounded-3xl bg-gradient-to-b from-[#3aa0ff] to-[#1f6fd6] py-3 font-display font-extrabold text-white shadow-[0_10px_30px_rgba(31,111,214,0.5)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </span>
              <span className="relative z-10 text-lg">{phase === "charging" ? "AWAKENING…" : onChainMint ? "MINT SOLAXY" : "SPIN DNA"}</span>
              <span className="relative z-10 inline-flex items-center gap-1 text-[0.7rem] font-bold text-white/80">
                {onChainMint ? (
                  <><GameIcon src={UI.coin} size={14} /> {COSTS.roll.solax.toLocaleString()} SOLAX</>
                ) : (
                  <><GameIcon src={UI.dna} size={14} /> 1 · <GameIcon src={UI.energy} size={14} /> 10</>
                )}
              </span>
            </button>
            <button
              onClick={() => spin(10)}
              disabled={phase === "charging" || (!onChainMint && (world.resources.energy < COSTS.roll.energy * 10 || world.resources.dna < COSTS.roll.dna * 10))}
              className="group relative flex flex-1 flex-col items-center rounded-3xl bg-gradient-to-b from-[#ffb340] to-[#ff8a1f] py-3 font-display font-extrabold text-white shadow-[0_10px_30px_rgba(255,138,31,0.5)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </span>
              <span className="absolute -right-1 -top-3 z-20 rounded-full border-2 border-ink-900 bg-rose-500 px-2 py-0.5 text-[0.58rem] font-extrabold leading-none shadow-[0_2px_8px_rgba(244,63,94,0.55)]">
                -10%
              </span>
              <span className="relative z-10 text-lg">{onChainMint ? "10× MINT" : "10X SPIN"}</span>
              <span className="relative z-10 inline-flex items-center gap-1 text-[0.7rem] font-bold text-white/90">
                {onChainMint ? (
                  <><GameIcon src={UI.coin} size={14} /> {(COSTS.roll.solax * 10).toLocaleString()} SOLAX</>
                ) : (
                  <><GameIcon src={UI.dna} size={14} /> 10 · <GameIcon src={UI.energy} size={14} /> 100</>
                )}
              </span>
            </button>
          </div>
          <p className="mt-2 text-[0.66rem] text-white/55">Guaranteed <span className="font-bold text-fuchsia-300">Epic</span> or higher in 8 spins!</p>

          {/* boosters */}
          <Panel className="mt-3 w-full p-3">
            <SectionTitle accent="#c08bff">Increase your odds</SectionTitle>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BOOSTERS.map((b) => {
                const on = boosts[b.id];
                const owned = world.resources.items?.[b.id] ?? 0;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      if (!on && owned === 0 && world.resources.dna < b.cost) {
                        world.toast(`Need ${b.cost} DNA or buy at Harbor`);
                        return;
                      }
                      setBoosts((s) => ({ ...s, [b.id]: !s[b.id] }));
                    }}
                    className="flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-center transition hover:-translate-y-0.5"
                    style={{ borderColor: on ? b.color : "rgba(255,255,255,0.1)", background: on ? `${b.color}22` : "rgba(0,0,0,0.25)" }}
                  >
                    <GameIcon src={b.icon} size={24} glow={b.color} />
                    <span className="text-[0.66rem] font-extrabold text-white">{b.name}</span>
                    <span className="text-[0.56rem]" style={{ color: b.color }}>{b.note}</span>
                    {owned > 0 ? (
                      <span className="text-[0.6rem] font-bold text-emerald-300">×{owned} owned</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-white/70">
                        <GameIcon src={UI.dna} size={12} /> {b.cost}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>
        </section>

        {/* Right rail */}
        <aside className="col-span-12 space-y-3 lg:col-span-3">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <SectionTitle accent="#c08bff">Featured Solaxies</SectionTitle>
              <span className="text-[0.62rem] text-brand-300">View all</span>
            </div>
            <div className="mt-2 rounded-2xl border border-brand-400/30 bg-gradient-to-b from-brand-500/15 to-transparent p-3 text-center">
              <img src="/sprites/cosmetics/cosmic-bird.png" alt="Cosmic Solaxy" className="mx-auto h-28 w-28 animate-floaty object-contain" style={{ filter: "drop-shadow(0 0 18px rgba(196,107,255,0.8))" }} />
              <div className="font-display text-base font-extrabold text-white">Cosmic Solaxy</div>
              <div className="text-[0.6rem] font-bold uppercase tracking-widest text-fuchsia-300">Cosmic</div>
              <div className="my-1"><Stars rarity="Cosmic" /></div>
              <p className="text-[0.62rem] text-white/55">Highest genetic potential. Only 1% chance to obtain!</p>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <SectionTitle accent="#c08bff">Recent Reveals</SectionTitle>
              <span className="text-[0.62rem] text-brand-300">View more</span>
            </div>
            <div className="mt-2 space-y-2">
              {world.feed.slice(0, 6).map((f) => (
                <div key={f.id} className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: `${f.color}33` }}>
                    <GameIcon src={UI.egg} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.72rem] font-bold text-white">{f.who}</div>
                    <div className="truncate text-[0.6rem]" style={{ color: f.color }}>{f.what}</div>
                  </div>
                  <span className="text-[0.55rem] text-white/40">{f.t}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-[0.66rem] font-bold text-brand-300">Be the next to unlock greatness!</div>
          </Panel>
        </aside>
      </div>

      {phase === "revealed" && results.length > 0 ? (
        <RevealOverlay results={results} count={lastCount} canAfford={world.resources.dna >= lastCount} onClose={closeReveal} onAddToPond={addToPond} onAgain={() => spin(lastCount)} />
      ) : null}
    </ScreenShell>
  );
}

/** Idle pod, or the charging build-up before a reveal. */
function ChamberStage({ phase }: { phase: string }) {
  if (phase === "charging") {
    return (
      <div className="relative grid place-items-center">
        <span className="absolute h-72 w-72 animate-rayspin rounded-full opacity-60" style={{ background: "repeating-conic-gradient(from 0deg, rgba(196,107,255,0.35) 0deg 5deg, transparent 5deg 16deg)", maskImage: "radial-gradient(circle, black 30%, transparent 72%)", WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 72%)" }} />
        <span className="absolute h-48 w-48 animate-ping rounded-full bg-fuchsia-500/20" />
        {/* converging sparks */}
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="absolute h-1.5 w-1.5 animate-sparkle rounded-full bg-fuchsia-200" style={{ left: `${50 + 40 * Math.cos((i / 10) * Math.PI * 2)}%`, top: `${50 + 40 * Math.sin((i / 10) * Math.PI * 2)}%`, animationDelay: `${i * 0.12}s` }} />
        ))}
        <span className="absolute h-44 w-44 rounded-full bg-fuchsia-500/40 blur-2xl" />
        <img src="/egg-cosmic.png" alt="" className="relative h-48 w-48 animate-charge object-contain" draggable={false} style={{ filter: "drop-shadow(0 0 36px rgba(196,107,255,0.95))" }} />
        <div className="absolute -bottom-4 font-display text-sm font-bold tracking-widest text-fuchsia-200 animate-pulse">SEQUENCING DNA…</div>
      </div>
    );
  }
  return (
    <div className="relative grid place-items-center text-center">
      {/* slow rotating ray halo */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 animate-rayspin rounded-full opacity-25"
        style={{
          background: "repeating-conic-gradient(from 0deg, rgba(120,200,255,0.30) 0deg 4deg, transparent 4deg 18deg)",
          maskImage: "radial-gradient(circle, transparent 38%, black 52%, transparent 74%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 38%, black 52%, transparent 74%)",
        }}
      />
      {/* breathing color aura */}
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 animate-aura rounded-full bg-fuchsia-500/25 blur-3xl" />

      {/* rotating containment ring */}
      <svg viewBox="0 0 200 200" className="animate-orbit h-72 w-72 opacity-50" fill="none">
        <circle cx="100" cy="100" r="92" stroke="rgba(150,210,255,0.5)" strokeWidth="1.2" strokeDasharray="3 11" />
        <circle cx="100" cy="100" r="78" stroke="rgba(196,107,255,0.45)" strokeWidth="1" strokeDasharray="1 16" />
      </svg>

      {/* orbiting DNA orbs (two counter-rotating rings) */}
      <OrbitRing size={236} count={6} className="animate-orbit" color="#7ec8ff" />
      <OrbitRing size={300} count={8} className="animate-orbitrev" color="#c46bff" small />

      {/* rising bubbles / energy motes */}
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="pointer-events-none absolute bottom-6 h-2 w-2 animate-bubble rounded-full bg-cyan-200/70"
          style={{ left: b.left, width: b.s, height: b.s, animationDelay: `${b.d}s`, animationDuration: `${b.dur}s`, boxShadow: "0 0 8px rgba(150,220,255,0.8)" }}
        />
      ))}

      {/* drifting twinkles */}
      {TWINKLES.map((t, i) => (
        <span key={`t${i}`} className="pointer-events-none absolute animate-twinkle text-fuchsia-200" style={{ left: t.left, top: t.top, fontSize: t.s, animationDelay: `${t.d}s` }}>
          ✦
        </span>
      ))}

      {/* the egg — floaty bob, breathing scale, color-shifting glow */}
      <div className="relative animate-floaty">
        <div className="animate-breathe">
          <img src="/egg-cosmic.png" alt="" className="relative h-48 w-48 animate-eggglow object-contain" draggable={false} />
        </div>
      </div>

      <div className="absolute -bottom-6 text-[0.72rem] text-white/55">Press spin to awaken new life</div>
    </div>
  );
}

const BUBBLES = [
  { left: "38%", s: 6, d: 0, dur: 5.5 },
  { left: "46%", s: 4, d: 1.2, dur: 6.4 },
  { left: "52%", s: 7, d: 0.6, dur: 5 },
  { left: "58%", s: 5, d: 2.1, dur: 6 },
  { left: "63%", s: 4, d: 1.6, dur: 5.8 },
  { left: "43%", s: 5, d: 3, dur: 6.6 },
  { left: "55%", s: 6, d: 2.6, dur: 5.3 },
];

const TWINKLES = [
  { left: "26%", top: "22%", s: 14, d: 0 },
  { left: "72%", top: "30%", s: 11, d: 0.8 },
  { left: "30%", top: "70%", s: 10, d: 1.5 },
  { left: "70%", top: "66%", s: 13, d: 2.2 },
  { left: "50%", top: "12%", s: 12, d: 1.1 },
];

/** A ring of glowing orbs that rotates as a group. */
function OrbitRing({ size, count, color, className, small }: { size: number; count: number; color: string; className: string; small?: boolean }) {
  const r = size / 2;
  const dot = small ? 5 : 8;
  return (
    <div className={`pointer-events-none absolute ${className}`} style={{ width: size, height: size }}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: dot,
              height: dot,
              left: r + r * Math.cos(a) - dot / 2,
              top: r + r * Math.sin(a) - dot / 2,
              background: color,
              boxShadow: `0 0 ${dot + 4}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
}

function RayBurst({ color, strong }: { color: string; strong: boolean }) {
  const mask = "radial-gradient(circle, black 8%, rgba(0,0,0,0.85) 22%, rgba(0,0,0,0.35) 48%, transparent 72%)";
  return (
    <>
      <span
        className="pointer-events-none absolute left-1/2 top-[42%] h-[min(140vw,48rem)] w-[min(140vw,48rem)] animate-rayspin rounded-full"
        style={{
          opacity: strong ? 0.95 : 0.55,
          background: `repeating-conic-gradient(from 0deg, ${color} 0deg 3.5deg, transparent 3.5deg 12deg)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <span
        className="pointer-events-none absolute left-1/2 top-[42%] h-[min(120vw,40rem)] w-[min(120vw,40rem)] animate-rayspin rounded-full"
        style={{
          opacity: strong ? 0.45 : 0.25,
          animationDuration: "16s",
          animationDirection: "reverse",
          background: "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.65) 0deg 2deg, transparent 2deg 10deg)",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <span
        className="pointer-events-none absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: `${color}55`, opacity: strong ? 0.9 : 0.5 }}
      />
    </>
  );
}

function RevealOverlay({ results, count, canAfford, onClose, onAddToPond, onAgain }: { results: Axol[]; count: number; canAfford: boolean; onClose: () => void; onAddToPond: () => void; onAgain: () => void }) {
  const best = results.reduce((a, b) => (RARITY_META[b.rarity].stars > RARITY_META[a.rarity].stars ? b : a), results[0]);
  const tier = TIER[best.rarity];
  const color = tier.color;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-ink-900/92 px-4 backdrop-blur-sm" onClick={onClose}>
      {/* white flash on entry */}
      <span className="pointer-events-none absolute inset-0 animate-flashout bg-white" />
      {/* rarity edge glow */}
      <span className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 200px 40px ${color}55` }} />

      {tier.confetti > 0 ? <Confetti count={tier.confetti} color={color} /> : null}

      <div className={`relative flex flex-col items-center ${tier.shake ? "animate-shake" : ""}`}>
        <RayBurst color={color} strong={tier.confetti > 0} />
        {/* rarity color wash over the rays */}
        <span className="pointer-events-none absolute left-1/2 top-[42%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-overlay" style={{ background: `radial-gradient(circle, ${color}55 0%, transparent 70%)` }} />
        {/* shockwave rings */}
        <span className="pointer-events-none absolute left-1/2 top-[42%] h-40 w-40 animate-shockwave rounded-full border-2" style={{ borderColor: color }} />
        <span className="pointer-events-none absolute left-1/2 top-[42%] h-40 w-40 animate-shockwave rounded-full border-2" style={{ borderColor: color, animationDelay: "0.18s" }} />

        {/* rarity banner */}
        <div className="relative z-10 mb-1 animate-bannerin">
          <div
            className="rounded-full px-6 py-1.5 font-display text-2xl font-extrabold tracking-wide text-white sm:text-3xl"
            style={{ background: `linear-gradient(90deg, ${color}, #ffffff44, ${color})`, backgroundSize: "200% 100%", boxShadow: `0 0 30px ${color}`, textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}
          >
            <span className="animate-shimmer bg-gradient-to-r from-white via-white/60 to-white bg-[length:200%_100%] bg-clip-text">{tier.label}</span>
          </div>
        </div>

        {/* stars */}
        <div className="relative z-10 mb-1 flex gap-1">
          {Array.from({ length: RARITY_META[best.rarity].stars }).map((_, i) => (
            <span key={i} className="animate-starpop text-2xl" style={{ color, animationDelay: `${0.35 + i * 0.1}s`, textShadow: `0 0 12px ${color}` }}>★</span>
          ))}
        </div>

        {/* the creature */}
        <div className="relative z-10 grid place-items-center">
          <span className="absolute h-64 w-64 rounded-full blur-3xl" style={{ background: `${color}66` }} />
          <img src={axolSprite(best)} alt="" className="relative h-56 w-56 animate-slamin object-contain sm:h-64 sm:w-64" draggable={false} style={{ filter: `drop-shadow(0 0 26px ${color}) drop-shadow(0 14px 18px rgba(0,0,0,0.6))` }} />
          <span className="absolute -right-2 top-2 animate-starpop rounded-full bg-rose-500 px-2 py-0.5 text-[0.6rem] font-extrabold text-white" style={{ animationDelay: "0.6s" }}>NEW!</span>
        </div>

        {/* identity */}
        <div className="relative z-10 mt-1 flex items-center gap-2">
          <img src={CLASS_META[best.cls].sprite} alt="" className="h-7 w-7 object-contain drop-shadow" draggable={false} />
          <span className="font-display text-2xl font-extrabold text-white">{CLASS_META[best.cls].name} #{best.id}</span>
        </div>
        <div className="relative z-10 text-[0.74rem] font-bold" style={{ color }}>{tier.tag}</div>

        {/* quick stats */}
        <div className="relative z-10 mt-2 flex gap-2 text-center text-white">
          <Mini label="HP" v={best.hp} c="#ff6b6b" />
          <Mini label="ATK" v={best.attack} c="#ffb02e" />
          <Mini label="DEF" v={best.defense} c="#3db4ff" />
          <Mini label="SPD" v={best.speed} c="#54e07a" />
        </div>

        {/* 10x strip */}
        {count > 1 ? (
          <div className="relative z-10 mt-3 flex max-w-full flex-wrap justify-center gap-1.5">
            {results.map((a, i) => {
              const rc = RARITY_META[a.rarity].color;
              const isBest = a.id === best.id;
              return (
                <div key={a.id} className="animate-pop rounded-xl border bg-black/40 p-1" style={{ borderColor: isBest ? rc : "rgba(255,255,255,0.12)", boxShadow: isBest ? `0 0 12px ${rc}` : "none", animationDelay: `${i * 0.04}s` }}>
                  <img src={axolSprite(a)} alt="" className="h-9 w-9 object-contain" draggable={false} />
                </div>
              );
            })}
          </div>
        ) : null}

        {/* actions */}
        <div className="relative z-10 mt-4 flex gap-3" onClick={(e) => e.stopPropagation()}>
          <button onClick={onAgain} disabled={!canAfford} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8a37ff] to-[#d63cff] px-6 py-2.5 font-display font-extrabold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-50">
            {count > 1 ? "Spin 10 Again" : "Spin Again"} <GameIcon src={UI.dna} size={16} /> {count}
          </button>
          <button onClick={onAddToPond} className="rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-400 to-amber-600 px-6 py-2.5 font-display font-extrabold text-ink-900 shadow-glow transition hover:-translate-y-0.5">
            Add to Pond
          </button>
        </div>
        <div className="relative z-10 mt-2 text-[0.6rem] text-white/40">tap outside to keep spinning</div>
      </div>
    </div>
  );
}

function Mini({ label, v, c }: { label: string; v: number; c: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1">
      <div className="font-display text-base font-extrabold leading-none">{v}</div>
      <div className="text-[0.5rem] font-bold" style={{ color: c }}>{label}</div>
    </div>
  );
}

function Confetti({ count, color }: { count: number; color: string }) {
  const colors = [color, "#ffd24a", "#ffffff", "#ff5fb0", "#54e07a", "#3db4ff"];
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.6 + Math.random() * 1.8,
        c: colors[i % colors.length],
        w: 5 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        round: Math.random() < 0.4,
      })),
    [count] // eslint-disable-line react-hooks/exhaustive-deps
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 animate-confetti"
          style={{ left: `${p.left}%`, width: p.w, height: p.round ? p.w : p.h, background: p.c, borderRadius: p.round ? "9999px" : "2px", animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
}
