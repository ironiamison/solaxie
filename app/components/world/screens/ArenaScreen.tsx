import { useEffect, useRef, useState } from "react";
import {
  Axol,
  AxolClass,
  BattleResult,
  CLASS_META,
  RARITY_META,
  Replay,
  ReplayEvent,
  axolSprite,
  buildReplay,
  wildAxol,
} from "@/lib/game";
import { sfx } from "@/lib/sfx";
import type { WorldApi } from "../world";
import { Panel, ScreenShell, ScreenTop, SectionTitle } from "../ScreenChrome";

type Phase = "lobby" | "searching" | "matched" | "commencing" | "replay" | "result";

const ENERGY_COST = 10;

// Team capacity: 5 free slots, then SOLAX-gated expansion slots. Paying for a
// slot spends (burns) the SOLAX — it leaves the player's balance for good,
// matching the on-chain token burn model.
const FREE_SLOTS = 5;
const SLOT_PRICES = [20000, 55000]; // cost to unlock slot 6, then slot 7
const MAX_TEAM = FREE_SLOTS + SLOT_PRICES.length;

const ITEMS = [
  { id: "rage", name: "Rage Potion", img: "/item-rage.png", desc: "Attack up", count: 3, color: "#ff6b6b" },
  { id: "shield", name: "Crystal Shield", img: "/item-shield.png", desc: "Defense up", count: 2, color: "#3db4ff" },
  { id: "orb", name: "Lightning Orb", img: "/item-orb.png", desc: "Speed up", count: 4, color: "#ffd24a" },
  { id: "clover", name: "Lucky Clover", img: "/item-clover.png", desc: "Crit up", count: 1, color: "#54e07a" },
];

const SPECTATOR_SPRITES = ["bird", "aquatic", "plant", "beast", "bug", "reptile"] as const;

// HP-bar / identity colors per class (matches the requested palette).
const BATTLE_COLOR: Record<AxolClass, string> = {
  plant: "#54e07a",
  bug: "#a779ff",
  bird: "#ff5fb0",
  aquatic: "#3db4ff",
  beast: "#ffa83d",
  reptile: "#ffd24a",
};

const OPP_NAMES = ["AxolMaster", "CoralKing", "NeonFin", "VoidSerpent", "PixelPaws", "LunarGill", "ApexBeast", "SporeLord", "TidalQueen", "EmberFang", "GlitchToad", "MysticGill"];
const OPP_TITLES = ["Tide Runner", "Cave Champion", "Gene Hunter", "Storm Caller", "Relic Seeker", "Apex Trainer"];

function rankName(t: number): string {
  if (t < 900) return "Bronze IV";
  if (t < 1100) return "Bronze III";
  if (t < 1300) return "Bronze II";
  if (t < 1500) return "Bronze I";
  if (t < 1800) return "Silver III";
  return "Silver II";
}

type Opponent = { name: string; title: string; trophies: number; rank: string; winRate: number; team: Axol[] };

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ArenaScreen({ world }: { world: WorldApi }) {
  const team = world.axols.slice(0, MAX_TEAM);
  const [myId, setMyId] = useState<number | null>(team[0]?.id ?? null);
  const mine = world.axols.find((a) => a.id === myId) ?? team[0];

  const [phase, setPhase] = useState<Phase>("lobby");
  const [enemy, setEnemy] = useState<Axol | null>(null);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [replay, setReplay] = useState<Replay | null>(null);
  const [shown, setShown] = useState<ReplayEvent | null>(null);
  const [log, setLog] = useState<ReplayEvent[]>([]);
  const [mineHp, setMineHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [items, setItems] = useState<string[]>([]);
  const [trophies, setTrophies] = useState(1254);
  const [streak, setStreak] = useState(3);
  const [floatKey, setFloatKey] = useState(0);
  const [bigShake, setBigShake] = useState(false);
  const [speed, setSpeed] = useState(1);

  const runToken = useRef(0);
  const speedRef = useRef(1);
  const skipRef = useRef(false);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => () => void (runToken.current += 1), []);

  const setSpeedSafe = (s: number) => {
    setSpeed(s);
    speedRef.current = s;
  };

  const busy = phase === "searching" || phase === "matched" || phase === "commencing" || phase === "replay";

  async function findOpponent() {
    if (!mine || busy) return;
    if (world.resources.energy < ENERGY_COST) {
      world.toast("Not enough energy");
      return;
    }
    const token = ++runToken.current;
    const alive = () => token === runToken.current;

    sfx.click();
    skipRef.current = false;
    setSpeedSafe(1);
    setResult(null);
    setReplay(null);
    setShown(null);
    setLog([]);
    setEnemy(null);
    setPhase("searching");

    const out = await world.doBattle(mine.id);
    if (!alive()) return;
    if (!out) {
      setPhase("lobby");
      return;
    }

    await delay(1500);
    if (!alive()) return;

    const rep = buildReplay(out.mine, out.enemy, out.result.win, items);
    const et = Math.max(820, trophies + (Math.floor(Math.random() * 130) - 60));
    const oppName = OPP_NAMES[Math.floor(Math.random() * OPP_NAMES.length)];
    setEnemy(out.enemy);
    setOpponent({
      name: oppName,
      title: OPP_TITLES[Math.floor(Math.random() * OPP_TITLES.length)],
      trophies: et,
      rank: rankName(et),
      winRate: 46 + Math.floor(Math.random() * 28),
      team: [out.enemy, wildAxol(out.mine), wildAxol(out.mine)],
    });
    setResult(out.result);
    setReplay(rep);
    setMineHp(rep.mineMax);
    setEnemyHp(rep.enemyMax);
    sfx.match();
    setPhase("matched");

    await delay(1700);
    if (!alive()) return;
    setPhase("commencing");

    await delay(1100);
    if (!alive()) return;
    setPhase("replay");

    for (const ev of rep.events) {
      if (!alive()) return;
      setShown(ev);
      setMineHp(ev.mineHp);
      setEnemyHp(ev.enemyHp);
      if (ev.kind === "attack") {
        if (!skipRef.current) sfx.hit(!!ev.crit, !!ev.eff);
        setFloatKey((k) => k + 1);
        if (ev.crit || ev.eff) {
          setBigShake(true);
          setTimeout(() => setBigShake(false), 360);
        }
        setLog((l) => [ev, ...l].slice(0, 9));
      } else if (ev.kind === "win") {
        setLog((l) => [ev, ...l].slice(0, 9));
      }
      const base = ev.kind === "attack" ? 950 : 800;
      await delay(skipRef.current ? 30 : base / speedRef.current);
    }

    if (!alive()) return;
    await delay(300);
    out.result.win ? sfx.win() : sfx.lose();
    setStreak((s) => (out.result.win ? s + 1 : 0));
    setTrophies((t) => Math.max(0, t + (out.result.win ? 8 : -6)));
    world.recordBattle({
      opponent: oppName,
      win: out.result.win,
      axolName: out.mine.name,
      axolCls: out.mine.cls,
      rewardSolax: out.result.rewardSolax,
      rewardXp: out.result.rewardXp,
      trophiesDelta: out.result.win ? 8 : -6,
      at: "just now",
    });
    setPhase("result");
  }

  function backToLobby() {
    runToken.current += 1;
    skipRef.current = false;
    setSpeedSafe(1);
    setPhase("lobby");
    setEnemy(null);
    setShown(null);
    setResult(null);
    setReplay(null);
    setLog([]);
  }

  function skip() {
    skipRef.current = true;
  }

  return (
    <ScreenShell bg="/arena-bg.png" dark={0.5}>
      <ScreenTop
        world={world}
        title="ARENA CAVE"
        subtitle="Climb the ladder, earn glory!"
        icon="/icon-arena.png"
        center={<RankPill trophies={trophies} />}
      />

      <div className="mx-auto max-w-[1500px] px-3 pb-28 sm:px-5">
        <Stage
          mine={mine}
          enemy={enemy}
          phase={phase}
          mineHp={mineHp}
          enemyHp={enemyHp}
          replay={replay}
          shown={shown}
          floatKey={floatKey}
          bigShake={bigShake}
          speed={speed}
          onSpeed={setSpeedSafe}
          onSkip={skip}
          opponent={opponent}
          myTeam={team}
          myName={world.profile.name}
          trophies={trophies}
          result={result}
          items={items}
          onAgain={findOpponent}
          onLobby={backToLobby}
        />

        {phase === "lobby" ? (
          <div className="mt-4 space-y-4">
            <div className="flex justify-center">
              <FindButton onClick={findOpponent} energy={world.resources.energy} />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <RankLadder trophies={trophies} streak={streak} />
              </div>
              <div className="lg:col-span-5">
                <BattleItemsPanel items={items} setItems={setItems} />
              </div>
              <div className="lg:col-span-3">
                <WinRewards />
              </div>
            </div>
            <TeamTray world={world} team={team} myId={myId} setMyId={setMyId} />
          </div>
        ) : (
          <div className="mt-4">
            <BattleLog log={log} />
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// Stage — the arena floor, ambiance, fighters and battle overlays
// ---------------------------------------------------------------------------

function Stage({
  mine,
  enemy,
  phase,
  mineHp,
  enemyHp,
  replay,
  shown,
  floatKey,
  bigShake,
  speed,
  onSpeed,
  onSkip,
  opponent,
  myTeam,
  myName,
  trophies,
  result,
  items,
  onAgain,
  onLobby,
}: {
  mine?: Axol;
  enemy: Axol | null;
  phase: Phase;
  mineHp: number;
  enemyHp: number;
  replay: Replay | null;
  shown: ReplayEvent | null;
  floatKey: number;
  bigShake: boolean;
  speed: number;
  onSpeed: (s: number) => void;
  onSkip: () => void;
  opponent: Opponent | null;
  myTeam: Axol[];
  myName: string;
  trophies: number;
  result: BattleResult | null;
  items: string[];
  onAgain: () => void;
  onLobby: () => void;
}) {
  const dual = !!enemy && (phase === "matched" || phase === "commencing" || phase === "replay" || phase === "result");
  const mineShake = shown?.kind === "attack" && shown.side === "enemy";
  const enemyShake = shown?.kind === "attack" && shown.side === "mine";
  const mineAttacking = shown?.kind === "attack" && shown.side === "mine";
  const enemyAttacking = shown?.kind === "attack" && shown.side === "enemy";
  const bigFlash = phase === "replay" && shown?.kind === "attack" && (!!shown.crit || !!shown.eff);
  const winnerSide = result ? (result.win ? "mine" : "enemy") : null;

  return (
    <div
      className={`relative mt-1 overflow-hidden rounded-[2rem] border border-white/10 shadow-panel ${bigShake ? "animate-shake" : ""}`}
      style={{ height: "min(64vh, 660px)" }}
    >
      <Ambiance />
      <AltarFloor active={phase !== "lobby"} hot={phase === "commencing" || phase === "matched"} />

      {/* per-class attack VFX */}
      {phase === "replay" && shown?.kind === "attack" ? <AttackFx ev={shown} fxKey={floatKey} /> : null}

      {/* crit / super-effective screen flash */}
      {bigFlash ? <span key={`flash-${floatKey}`} className="pointer-events-none absolute inset-0 z-30 animate-flashout" style={{ background: shown?.crit ? "rgba(255,200,120,0.28)" : "rgba(120,255,170,0.22)" }} /> : null}

      {/* single hero (lobby / searching) */}
      {!dual && mine ? (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2">
          <BigFighter axol={mine} side="left" size="clamp(220px,46vw,420px)" dim={phase === "searching"} hero />
        </div>
      ) : null}

      {/* dual fighters */}
      {dual && mine ? (
        <>
          <div className="absolute bottom-[14%] left-[3%] animate-slideinl sm:left-[7%]">
            <BigFighter
              axol={mine}
              side="left"
              size="clamp(160px,34vw,330px)"
              hp={mineHp}
              max={replay?.mineMax}
              shake={mineShake}
              attacking={mineAttacking}
              celebrate={phase === "result" && winnerSide === "mine"}
              defeated={phase === "result" && winnerSide === "enemy"}
              floatEv={shown?.side === "enemy" ? shown : null}
              floatKey={floatKey}
            />
          </div>
          <div className="absolute bottom-[14%] right-[3%] animate-slideinr sm:right-[7%]">
            <BigFighter
              axol={enemy!}
              side="right"
              size="clamp(160px,34vw,330px)"
              hp={enemyHp}
              max={replay?.enemyMax}
              shake={enemyShake}
              attacking={enemyAttacking}
              celebrate={phase === "result" && winnerSide === "enemy"}
              defeated={phase === "result" && winnerSide === "mine"}
              floatEv={shown?.side === "mine" ? shown : null}
              floatKey={floatKey}
            />
          </div>
        </>
      ) : null}

      {/* lobby title */}
      {phase === "lobby" ? (
        <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-center">
          <div className="rounded-full border border-amber-300/30 bg-ink-900/70 px-4 py-1 font-display text-sm font-extrabold tracking-[0.2em] text-amber-200 backdrop-blur">
            BATTLE ALTAR
          </div>
          <div className="mt-1 text-[0.66rem] text-white/55">Your champion awaits a challenger</div>
        </div>
      ) : null}

      {/* banner only for non-attack beats (advantage / item / win) — damage shows over the fighter */}
      {phase === "replay" && shown && shown.kind !== "attack" ? <ActionBanner ev={shown} /> : null}

      {/* speed controls */}
      {phase === "replay" ? <SpeedControls speed={speed} onSpeed={onSpeed} onSkip={onSkip} /> : null}

      {/* phase overlays */}
      {phase === "searching" ? <SearchingOverlay trophies={trophies} /> : null}
      {phase === "matched" && enemy && mine && opponent ? (
        <VersusOverlay mine={mine} myTeam={myTeam} myName={myName} myTrophies={trophies} opponent={opponent} />
      ) : null}
      {phase === "commencing" ? <CommencingOverlay /> : null}
      {phase === "result" && result ? (
        <ResultOverlay result={result} items={items} trophies={trophies} onAgain={onAgain} onLobby={onLobby} />
      ) : null}
    </div>
  );
}

function SpeedControls({ speed, onSpeed, onSkip }: { speed: number; onSpeed: (s: number) => void; onSkip: () => void }) {
  return (
    <div className="absolute bottom-3 right-3 z-40 flex items-center gap-1 rounded-full border border-white/15 bg-ink-900/80 p-1 backdrop-blur">
      {[1, 2, 4].map((s) => (
        <button
          key={s}
          onClick={() => onSpeed(s)}
          className={`grid h-8 w-9 place-items-center rounded-full font-display text-[0.72rem] font-extrabold transition ${
            speed === s ? "bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-glow" : "text-white/60 hover:bg-white/10"
          }`}
        >
          {s}x
        </button>
      ))}
      <button
        onClick={onSkip}
        className="ml-0.5 rounded-full bg-white/10 px-3 py-1.5 font-display text-[0.72rem] font-extrabold text-white/85 transition hover:bg-white/20"
      >
        Skip
      </button>
    </div>
  );
}

function Ambiance() {
  const embers = [
    { l: "12%", d: 0 },
    { l: "27%", d: 1.4 },
    { l: "44%", d: 0.7 },
    { l: "63%", d: 2.1 },
    { l: "78%", d: 1.1 },
    { l: "90%", d: 0.4 },
  ];
  // Waterfall droplets fall through the misty band at top-center.
  const drops = [38, 44, 50, 56, 62, 41, 53, 59];
  // Dust motes drift slowly across the arena.
  const dust = [
    { l: "18%", t: "40%", d: 0, s: 3 },
    { l: "33%", t: "62%", d: 1.6, s: 2 },
    { l: "48%", t: "30%", d: 0.8, s: 4 },
    { l: "66%", t: "55%", d: 2.4, s: 2 },
    { l: "80%", t: "38%", d: 1.2, s: 3 },
    { l: "58%", t: "70%", d: 3.1, s: 2 },
  ];
  // Wall crystals that pulse their glow.
  const crystals = [
    { l: "4%", t: "52%", c: "#8b6bff", s: 16 },
    { l: "9%", t: "66%", c: "#3db4ff", s: 12 },
    { r: "4%", t: "52%", c: "#ff5fb0", s: 16 },
    { r: "9%", t: "66%", c: "#54e07a", s: 12 },
    { l: "20%", t: "78%", c: "#ffd24a", s: 10 },
    { r: "20%", t: "78%", c: "#3db4ff", s: 10 },
  ];
  return (
    <>
      {/* depth vignette */}
      <span className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 -60px 120px 10px rgba(8,5,18,0.85), inset 0 40px 90px rgba(8,5,18,0.5)" }} />
      {/* waterfall mist */}
      <span className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 animate-drift rounded-full bg-cyan-200/10 blur-3xl" />
      <span className="pointer-events-none absolute left-[30%] top-10 h-28 w-56 animate-drift rounded-full bg-white/5 blur-3xl" style={{ animationDelay: "2s" }} />

      {/* waterfall particles */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48">
        {drops.map((l, i) => (
          <span
            key={i}
            className="absolute top-0 w-[2px] animate-drip rounded-full bg-gradient-to-b from-cyan-100/90 to-transparent"
            style={{ left: `${l}%`, height: 16 + (i % 3) * 8, animationDelay: `${(i * 0.23).toFixed(2)}s`, animationDuration: `${1.5 + (i % 3) * 0.4}s`, boxShadow: "0 0 6px rgba(180,240,255,0.7)" }}
          />
        ))}
      </div>

      {/* floating dust motes */}
      {dust.map((m, i) => (
        <span
          key={`d${i}`}
          className="pointer-events-none absolute animate-floaty rounded-full bg-white/40"
          style={{ left: m.l, top: m.t, height: m.s, width: m.s, animationDelay: `${m.d}s`, animationDuration: `${6 + (i % 3) * 2}s`, filter: "blur(0.5px)", boxShadow: "0 0 6px rgba(255,255,255,0.5)" }}
        />
      ))}

      {/* pulsing wall crystals */}
      {crystals.map((c, i) => (
        <span
          key={`c${i}`}
          className="pointer-events-none absolute animate-pulse"
          style={{
            left: (c as { l?: string }).l,
            right: (c as { r?: string }).r,
            top: c.t,
            width: c.s,
            height: c.s * 1.6,
            background: `linear-gradient(180deg, #ffffffcc, ${c.c})`,
            clipPath: "polygon(50% 0, 100% 38%, 50% 100%, 0 38%)",
            filter: `drop-shadow(0 0 10px ${c.c})`,
            animationDelay: `${(i * 0.4).toFixed(1)}s`,
            opacity: 0.85,
          }}
        />
      ))}

      {/* torches */}
      <ArenaTorch className="left-[6%] top-[34%]" />
      <ArenaTorch className="right-[6%] top-[34%]" />
      <ArenaTorch className="left-[16%] top-[20%]" />
      <ArenaTorch className="right-[16%] top-[20%]" />

      {/* spectators */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex items-end justify-center gap-3 sm:gap-6">
        {SPECTATOR_SPRITES.map((c, i) => (
          <img
            key={c}
            src={CLASS_META[c].sprite}
            alt=""
            className="animate-bob object-contain opacity-30"
            style={{ width: 38 + (i % 3) * 8, filter: "brightness(0) blur(0.4px)", animationDelay: `${i * 0.5}s` }}
            draggable={false}
          />
        ))}
      </div>

      {/* embers */}
      {embers.map((e, i) => (
        <span
          key={i}
          className="pointer-events-none absolute bottom-[20%] h-1.5 w-1.5 animate-floaty rounded-full bg-amber-300/70"
          style={{ left: e.l, animationDelay: `${e.d}s`, boxShadow: "0 0 8px #ffb02e" }}
        />
      ))}
    </>
  );
}

function ArenaTorch({ className = "" }: { className?: string }) {
  return (
    <span className={`pointer-events-none absolute flex flex-col items-center ${className}`}>
      <span className="relative h-6 w-4">
        <span
          className="absolute inset-0 origin-bottom animate-flicker rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 70%, #fff3b0 0%, #ffb02e 45%, #ff6a00 80%, transparent 100%)",
            filter: "blur(0.5px) drop-shadow(0 0 10px #ff8a00)",
            clipPath: "polygon(50% 0, 80% 45%, 70% 100%, 30% 100%, 20% 45%)",
          }}
        />
      </span>
      <span className="h-4 w-1.5 rounded-sm bg-gradient-to-b from-[#8a5a2b] to-[#5e3b1a]" />
    </span>
  );
}

function AltarFloor({ active, hot }: { active: boolean; hot: boolean }) {
  return (
    <div className="pointer-events-none absolute bottom-[8%] left-1/2 -translate-x-1/2">
      <div className="relative grid place-items-center">
        {/* glow pool */}
        <span
          className={`absolute left-1/2 top-1/2 h-40 w-[34rem] max-w-[88vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-2xl transition-all duration-500 ${active ? "animate-aura" : ""}`}
          style={{ background: hot ? "radial-gradient(ellipse, rgba(255,120,40,0.5), transparent 70%)" : "radial-gradient(ellipse, rgba(150,90,255,0.4), transparent 70%)" }}
        />
        {/* rotating rune ring */}
        <span
          className="absolute left-1/2 top-1/2 h-44 w-[30rem] max-w-[84vw] animate-rayspin rounded-[50%] opacity-40"
          style={{
            background: "repeating-conic-gradient(from 0deg, rgba(180,150,255,0.35) 0deg 3deg, transparent 3deg 16deg)",
            maskImage: "radial-gradient(ellipse, transparent 60%, black 72%, transparent 88%)",
            WebkitMaskImage: "radial-gradient(ellipse, transparent 60%, black 72%, transparent 88%)",
          }}
        />
        {/* platform rim */}
        <span className="h-16 w-[26rem] max-w-[80vw] rounded-[50%] border-2 border-fuchsia-300/30" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(60,30,90,0.65), rgba(20,10,35,0.85))", boxShadow: "0 16px 40px rgba(0,0,0,0.6), inset 0 2px 14px rgba(180,140,255,0.35)" }} />
      </div>
    </div>
  );
}

const FX_COLOR: Record<AxolClass, string> = {
  plant: "#54e07a",
  bug: "#a779ff",
  bird: "#ff5fb0",
  beast: "#ffa83d",
  aquatic: "#3db4ff",
  reptile: "#ffd24a",
};

// High-juice per-class attack effects. The attacker side drives the travel
// direction; the impact lands over the defender with a white core flash,
// radial shards, and class-specific flavor.
function AttackFx({ ev, fxKey }: { ev: ReplayEvent; fxKey: number }) {
  const cls = ev.cls;
  if (!cls) return null;
  const fromLeft = ev.side === "mine";
  const color = FX_COLOR[cls];
  const big = !!ev.crit || !!ev.eff;
  const lane = "52%";
  const defX = fromLeft ? "76%" : "24%";
  const shards = big ? 10 : 7;

  return (
    <div key={fxKey} className="pointer-events-none absolute inset-0 z-20">
      {/* speed / motion lines trailing toward the defender */}
      {[0, 1, 2].map((i) => (
        <span
          key={`spd${i}`}
          className="absolute h-[3px] animate-swipein rounded-full"
          style={{
            top: `calc(${lane} + ${(i - 1) * 16}px)`,
            left: "26%",
            width: "50%",
            transformOrigin: fromLeft ? "left center" : "right center",
            background: `linear-gradient(${fromLeft ? "90deg" : "270deg"}, transparent, ${color}, transparent)`,
            filter: `drop-shadow(0 0 8px ${color})`,
            animationDelay: `${i * 0.04}s`,
            opacity: 0.85,
          }}
        />
      ))}

      {/* traveling slash/vine streak */}
      <div className="absolute" style={{ top: lane, left: "24%", width: "52%", transform: cls === "bug" ? "rotate(-12deg)" : undefined }}>
        <span
          className="block animate-swipein rounded-full"
          style={{
            height: cls === "plant" ? 13 : cls === "bug" ? 7 : 5,
            transformOrigin: fromLeft ? "left center" : "right center",
            background: `linear-gradient(${fromLeft ? "90deg" : "270deg"}, transparent, #fff, ${color}, transparent)`,
            filter: `drop-shadow(0 0 12px ${color})`,
          }}
        />
      </div>

      {/* feathers (bird) */}
      {cls === "bird"
        ? [0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute h-2 w-4 animate-risefade rounded-full bg-white"
              style={{ top: `calc(${lane} - ${i * 11}px)`, left: defX, filter: `drop-shadow(0 0 6px ${color})`, animationDelay: `${i * 0.05}s` }}
            />
          ))
        : null}

      {/* stone spikes thrust up (reptile) */}
      {cls === "reptile"
        ? [0, 1, 2].map((i) => (
            <span key={i} className="absolute animate-pop" style={{ top: `calc(${lane} + ${20 - i * 6}px)`, left: `calc(${defX} + ${(i - 1) * 26}px)`, transform: "translate(-50%,0)", animationDelay: `${i * 0.05}s` }}>
              <span style={{ display: "block", width: 0, height: 0, borderLeft: "13px solid transparent", borderRight: "13px solid transparent", borderBottom: `${44 - i * 8}px solid ${color}`, filter: `drop-shadow(0 0 8px ${color})` }} />
            </span>
          ))
        : null}

      {/* impact cluster over the defender */}
      <div className="absolute" style={{ top: lane, left: defX }}>
        {/* white-hot core flash */}
        <span className="absolute left-0 top-0 h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-burstpop rounded-full" style={{ background: "radial-gradient(circle, #ffffff 0%, #ffffffcc 40%, transparent 72%)" }} />
        {/* colored burst */}
        <span className="absolute left-0 top-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 animate-burstpop rounded-full" style={{ background: `radial-gradient(circle, ${color} 0%, ${color}99 38%, transparent 72%)` }} />
        {/* shockwave ring */}
        <span className="absolute left-0 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-burstpop rounded-full border-2" style={{ borderColor: `${color}cc`, animationDelay: "0.06s" }} />
        {big ? (
          <span className="absolute left-0 top-0 h-36 w-36 -translate-x-1/2 -translate-y-1/2 animate-burstpop rounded-full border" style={{ borderColor: "#ffffffaa", animationDelay: "0.12s" }} />
        ) : null}

        {/* radial shards */}
        {Array.from({ length: shards }).map((_, i) => (
          <span key={`sh${i}`} className="absolute left-0 top-0" style={{ transform: `rotate(${(360 / shards) * i}deg)`, transformOrigin: "0 0" }}>
            <span
              className="block animate-shardfly rounded-full"
              style={{ height: big ? 4 : 3, width: big ? 30 : 22, transformOrigin: "left center", background: `linear-gradient(90deg, #fff, ${color}, transparent)`, filter: `drop-shadow(0 0 5px ${color})`, animationDelay: `${(i % 3) * 0.02}s` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function HpBar({ hp, max, color, name, lvl, flip }: { hp: number; max: number; color: string; name: string; lvl: number; flip: boolean }) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  const low = pct <= 22;
  return (
    <div className={`mb-3 flex w-[150px] flex-col sm:w-[230px] ${flip ? "items-end" : "items-start"}`}>
      <div className={`flex w-full items-center justify-between px-1 pb-0.5 ${flip ? "flex-row-reverse" : ""}`}>
        <span className={`flex items-center gap-1 font-display text-[0.66rem] font-extrabold text-white ${flip ? "flex-row-reverse" : ""}`}>
          <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40" style={{ background: color, boxShadow: `0 0 7px ${color}` }} />
          {name} · Lv{lvl}
        </span>
        <span className="text-[0.58rem] font-bold tabular-nums text-white/70">
          {Math.max(0, Math.round(hp))}<span className="text-white/35">/{max}</span>
        </span>
      </div>
      <div
        className={`relative h-3.5 w-full overflow-hidden rounded-full border bg-black/55 shadow-inner ${low ? "animate-pulse border-rose-400/70" : "border-white/25"}`}
        style={{ boxShadow: low ? "0 0 10px rgba(255,95,109,0.5)" : `0 0 9px ${color}55` }}
      >
        <div
          className="relative h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(180deg, ${color}, ${color}cc 55%, ${color}88)` }}
        >
          {/* glossy top highlight for a candy-bar look */}
          <span className="absolute inset-x-0 top-0 h-1/3 rounded-t-full bg-white/35" />
          {/* leading edge glow */}
          <span className="absolute right-0 top-0 h-full w-1.5 bg-white/70 blur-[1px]" />
        </div>
      </div>
    </div>
  );
}

function BigFighter({
  axol,
  side,
  size,
  hp,
  max,
  shake,
  attacking,
  floatEv,
  floatKey,
  dim,
  hero,
  celebrate,
  defeated,
}: {
  axol: Axol;
  side: "left" | "right";
  size: string;
  hp?: number;
  max?: number;
  shake?: boolean;
  attacking?: boolean;
  floatEv?: ReplayEvent | null;
  floatKey?: number;
  dim?: boolean;
  hero?: boolean;
  celebrate?: boolean;
  defeated?: boolean;
}) {
  const cc = BATTLE_COLOR[axol.cls];
  const flip = side === "right";
  // Tiered combat text: super-effective (green) > crit (orange) > normal (white)
  const label = floatEv?.crit ? "CRITICAL!" : floatEv?.eff ? "SUPER EFFECTIVE" : null;
  const dmgColor = floatEv?.crit ? "#ff9b2e" : floatEv?.eff ? "#54e07a" : "#ffffff";
  // Motion: attacker lunges toward foe, defender gets knocked back + flashes.
  const anim = celebrate
    ? "animate-jump"
    : attacking
    ? side === "left"
      ? "animate-lunger"
      : "animate-lungel"
    : shake
    ? side === "left"
      ? "animate-recoill"
      : "animate-recoilr"
    : "";
  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      {typeof hp === "number" && max ? <HpBar hp={hp} max={max} color={cc} name={CLASS_META[axol.cls].name} lvl={axol.level} flip={flip} /> : null}

      <div key={`mv-${floatKey}`} className={`relative ${anim}`}>
        {/* contact shadow */}
        <span className="absolute -bottom-2 left-1/2 h-5 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/55 blur-md" />
        {/* aura */}
        <span className="absolute bottom-0 left-1/2 h-2/3 w-3/4 -translate-x-1/2 rounded-full blur-2xl" style={{ background: celebrate ? "#54e07a55" : `${cc}40` }} />

        {floatEv && floatEv.kind === "attack" ? (
          <div key={floatKey} className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 animate-risefade text-center">
            {label ? (
              <div className="font-display text-[0.78rem] font-black tracking-wide" style={{ color: dmgColor, textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
                {label}
              </div>
            ) : null}
            <div className="font-display font-black leading-none" style={{ color: dmgColor, fontSize: floatEv.crit || floatEv.eff ? "2.7rem" : "1.95rem", textShadow: "0 2px 12px rgba(0,0,0,0.95)" }}>
              −{floatEv.dmg}
            </div>
          </div>
        ) : null}

        <img
          src={axolSprite(axol)}
          alt=""
          className={`relative object-contain ${celebrate ? "" : "animate-floaty"}`}
          style={{
            width: size,
            transform: flip ? "scaleX(-1)" : undefined,
            filter: `drop-shadow(0 16px 20px rgba(0,0,0,0.6)) drop-shadow(0 0 26px ${celebrate ? "#54e07a" : cc}88) ${defeated ? "grayscale(0.7) brightness(0.6)" : ""}`,
            opacity: dim ? 0.45 : defeated ? 0.7 : 1,
          }}
          draggable={false}
        />

        {/* white hit-flash silhouette when struck */}
        {shake ? (
          <img
            src={axolSprite(axol)}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-20 animate-flashout object-contain"
            style={{ width: size, transform: flip ? "scaleX(-1)" : undefined, filter: "brightness(0) invert(1)" }}
            draggable={false}
          />
        ) : null}
      </div>

      {hero ? (
        <div className="mt-2 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-ink-900/75 px-4 py-1 backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: cc }} />
            <span className="font-display text-sm font-extrabold text-white">{CLASS_META[axol.cls].name}</span>
            <span className="text-[0.66rem] font-bold text-white/60">Lv.{axol.level}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-xs" style={{ color: i < RARITY_META[axol.rarity].stars ? RARITY_META[axol.rarity].color : "rgba(255,255,255,0.2)" }}>
                ★
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActionBanner({ ev }: { ev: ReplayEvent }) {
  const accent = ev.kind === "advantage" ? "#ffd24a" : ev.kind === "item" ? "#54e07a" : ev.crit ? "#ffd24a" : "#ffffff";
  return (
    <div key={ev.text + (ev.dmg ?? "")} className="pointer-events-none absolute left-1/2 top-6 z-30 -translate-x-1/2 animate-bannerin text-center">
      <div className="rounded-2xl border border-white/15 bg-ink-900/85 px-6 py-2 shadow-glow backdrop-blur">
        <div className="font-display text-xl font-extrabold tracking-wide sm:text-2xl" style={{ color: accent, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
          {ev.text}
        </div>
        {ev.sub ? <div className="text-[0.72rem] font-bold text-rose-300">{ev.sub}</div> : null}
        {ev.dmg ? <div className="text-[0.72rem] font-bold text-white/60">{ev.dmg} damage</div> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

function SearchingOverlay({ trophies }: { trophies: number }) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-ink-900/55 backdrop-blur-sm">
      <div className="flex flex-col items-center text-center">
        <div className="relative grid h-28 w-28 place-items-center">
          <span className="absolute inset-0 animate-searchspin rounded-full border-2 border-dashed border-fuchsia-300/60" />
          <span className="absolute inset-3 animate-rayspin rounded-full border border-cyan-300/40" />
          <span className="h-12 w-12 rotate-45 animate-pulse rounded-md bg-gradient-to-br from-cyan-300 to-fuchsia-500 shadow-[0_0_30px_rgba(180,120,255,0.8)]" />
        </div>
        <div className="mt-5 font-display text-xl font-extrabold tracking-widest text-white">
          SEARCHING<Dots />
        </div>
        <div className="mt-1 flex items-center gap-2 text-[0.72rem] text-white/60">
          <img src="/rank-bronze.png" alt="" className="h-5 w-5 object-contain" />
          Bronze III · {trophies.toLocaleString()} trophies
        </div>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <>
      <span className="animate-pulse">.</span>
      <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
      <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
    </>
  );
}

function VersusOverlay({ mine, myTeam, myName, myTrophies, opponent }: { mine: Axol; myTeam: Axol[]; myName: string; myTrophies: number; opponent: Opponent }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center px-2">
      <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-900/45 via-ink-900/20 to-cyan-900/45" />
      <span className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-shockwave rounded-full border-2 border-white/40" />
      <div className="relative flex w-full max-w-2xl flex-col items-center">
        <div className="animate-bannerin rounded-full bg-amber-400 px-5 py-1 font-display text-sm font-extrabold tracking-[0.25em] text-ink-900 shadow-glow">
          MATCH FOUND
        </div>
        <div className="mt-3 flex w-full items-stretch justify-center gap-2 sm:gap-3">
          <div className="flex-1 animate-slideinl">
            <ProfileCard name={myName} title="That's you" rank={rankName(myTrophies)} trophies={myTrophies} team={myTeam} side="left" you />
          </div>
          <div className="flex items-center">
            <span className="animate-starpop font-display text-4xl font-black text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)] sm:text-6xl">VS</span>
          </div>
          <div className="flex-1 animate-slideinr">
            <ProfileCard name={opponent.name} title={opponent.title} rank={opponent.rank} trophies={opponent.trophies} winRate={opponent.winRate} team={opponent.team} side="right" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ name, title, rank, trophies, winRate, team, side, you }: { name: string; title: string; rank: string; trophies: number; winRate?: number; team: Axol[]; side: "left" | "right"; you?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-ink-900/85 p-3 backdrop-blur ${you ? "border-emerald-400/40" : "border-rose-400/40"}`} style={{ boxShadow: `0 0 30px ${you ? "rgba(84,224,122,0.25)" : "rgba(255,95,109,0.25)"}` }}>
      <div className={`flex items-center gap-2 ${side === "right" ? "flex-row-reverse text-right" : ""}`}>
        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
          <img src="/avatar-axolotl.png" alt="" className="h-full w-full scale-110 object-cover" />
        </span>
        <div className={side === "right" ? "text-right" : ""}>
          <div className="font-display text-sm font-extrabold text-white">{name}</div>
          <div className="text-[0.56rem] text-white/50">{title}</div>
        </div>
      </div>
      <div className={`mt-2 flex items-center gap-1.5 ${side === "right" ? "flex-row-reverse" : ""}`}>
        <img src="/rank-bronze.png" alt="" className="h-5 w-5 object-contain" />
        <span className="font-display text-[0.66rem] font-extrabold text-amber-200">{rank}</span>
        <span className="text-[0.6rem] font-bold text-white/55">· {trophies.toLocaleString()}</span>
      </div>
      <div className={`mt-1 text-[0.58rem] font-bold ${side === "right" ? "text-right" : ""} ${you ? "text-emerald-300" : "text-white/55"}`}>
        {winRate != null ? `${winRate}% win rate` : "Ranked battle"}
      </div>
      <div className={`mt-2 flex gap-1 ${side === "right" ? "justify-end" : ""}`}>
        {team.slice(0, 3).map((a, i) => (
          <span key={i} className="grid h-8 w-8 place-items-center rounded-lg border bg-black/40" style={{ borderColor: `${BATTLE_COLOR[a.cls]}66` }}>
            <img src={axolSprite(a)} alt="" className="h-6 w-6 object-contain" draggable={false} />
          </span>
        ))}
      </div>
    </div>
  );
}

function CommencingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-ink-900/35">
      <div className="animate-charge font-display text-2xl font-extrabold tracking-[0.2em] text-white drop-shadow-[0_2px_14px_rgba(255,160,60,0.8)] sm:text-4xl">
        BATTLE COMMENCING<Dots />
      </div>
    </div>
  );
}

function ResultOverlay({ result, items, trophies, onAgain, onLobby }: { result: BattleResult; items: string[]; trophies: number; onAgain: () => void; onLobby: () => void }) {
  void items;
  const win = result.win;
  const delta = win ? 8 : -6;
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-ink-900/65 backdrop-blur-sm">
      {win
        ? Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="pointer-events-none absolute top-0 h-2 w-2 animate-confetti rounded-sm"
              style={{ left: `${6 + i * 6.6}%`, background: ["#ffd24a", "#54e07a", "#3db4ff", "#ff5fb0"][i % 4], animationDuration: `${2 + (i % 4) * 0.5}s`, animationDelay: `${(i % 5) * 0.15}s` }}
            />
          ))
        : null}

      <div className="flex w-full max-w-md flex-col items-center px-4 text-center">
        <div className={`animate-bannerin font-display text-5xl font-black tracking-wide sm:text-6xl ${win ? "text-emerald-300" : "text-rose-300"}`} style={{ textShadow: "0 3px 18px rgba(0,0,0,0.8)" }}>
          {win ? "VICTORY!" : "DEFEAT"}
        </div>
        <div className="mt-1 text-[0.72rem] text-white/60">
          You {result.myRoll} · Enemy {result.enemyRoll}
          {result.advantage !== "none" ? ` · ${result.advantage === "you" ? "type advantage" : "enemy advantage"}` : ""}
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <div className="animate-riseup" style={{ animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>
            <RewardChip img="/icons/coin.png" label="SOLAX" value={`+${result.rewardSolax}`} />
          </div>
          <div className="animate-riseup" style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}>
            <RewardChip img="/icons/dna.png" label="DNA" value={win ? "+5" : "+0"} />
          </div>
          <div className="animate-riseup" style={{ animationDelay: "0.45s", opacity: 0, animationFillMode: "forwards" }}>
            <RewardChip star label="XP" value={`+${result.rewardXp}`} />
          </div>
        </div>

        <LeagueProgress trophies={trophies} delta={delta} />

        <div className="mt-5 flex w-full items-center gap-3">
          <button
            onClick={onLobby}
            className="rounded-2xl border border-white/15 bg-ink-850/80 px-5 py-3 font-display text-sm font-extrabold text-white/85 backdrop-blur transition hover:border-white/40"
          >
            Lobby
          </button>
          <button
            onClick={onAgain}
            className="flex-1 animate-bannerin rounded-2xl bg-gradient-to-b from-[#ffc24a] to-[#ff7a1f] px-7 py-4 font-display text-xl font-extrabold text-white shadow-[0_16px_40px_rgba(255,122,31,0.55)] transition hover:-translate-y-0.5"
            style={{ animationDelay: "0.5s" }}
          >
            BATTLE AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}

const TIER_TROPHIES = 300;

function LeagueProgress({ trophies, delta }: { trophies: number; delta: number }) {
  const before = Math.max(0, trophies - delta);
  const beforePct = ((before % TIER_TROPHIES) / TIER_TROPHIES) * 100;
  const afterPct = ((trophies % TIER_TROPHIES) / TIER_TROPHIES) * 100;
  const [pct, setPct] = useState(beforePct);
  useEffect(() => {
    const t = setTimeout(() => setPct(afterPct), 350);
    return () => clearTimeout(t);
  }, [afterPct]);
  return (
    <div className="mt-4 w-full rounded-2xl border border-white/12 bg-ink-900/70 p-3 backdrop-blur">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-display text-[0.72rem] font-extrabold text-amber-200">
          <img src="/rank-bronze.png" alt="" className="h-5 w-5 object-contain" />
          Bronze III
        </span>
        <span className={`font-display text-[0.72rem] font-extrabold ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
          {delta >= 0 ? "+" : ""}
          {delta} · {trophies.toLocaleString()} trophies
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border border-white/15 bg-black/50">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-end gap-1 text-[0.6rem] text-white/55">
        Next reward:
        <img src="/egg-cosmic.png" alt="" className="h-4 w-4 object-contain" />
        <span className="font-bold text-fuchsia-200">Epic Egg</span>
      </div>
    </div>
  );
}

function RewardChip({ img, star, label, value }: { img?: string; star?: boolean; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/12 bg-ink-900/70 px-4 py-2 backdrop-blur">
      {star ? (
        <span className="grid h-7 w-7 place-items-center text-xl text-amber-300">★</span>
      ) : (
        <img src={img} alt="" className="h-7 w-7 object-contain" />
      )}
      <div className="font-display text-sm font-extrabold text-white">{value}</div>
      <div className="text-[0.5rem] uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lobby panels
// ---------------------------------------------------------------------------

function FindButton({ onClick, energy }: { onClick: () => void; energy: number }) {
  const ok = energy >= ENERGY_COST;
  return (
    <button
      onClick={onClick}
      disabled={!ok}
      className="group relative flex items-center gap-3 rounded-[1.6rem] bg-gradient-to-b from-[#ffc24a] to-[#ff7a1f] px-10 py-4 font-display text-2xl font-extrabold tracking-wide text-white shadow-[0_16px_44px_rgba(255,122,31,0.55)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="absolute inset-x-6 top-1.5 h-2 rounded-full bg-white/40 blur-[2px]" />
      FIND OPPONENT
      <span className="flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-sm">
        <img src="/icon-energy.png" alt="" className="h-4 w-4 object-contain" />
        {ENERGY_COST}
      </span>
    </button>
  );
}

function RankPill({ trophies }: { trophies: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-ink-900/70 px-3 py-1.5 backdrop-blur">
      <img src="/rank-bronze.png" alt="" className="h-7 w-7 object-contain" />
      <div className="leading-tight">
        <div className="font-display text-[0.72rem] font-extrabold text-amber-200">BRONZE III</div>
        <div className="text-[0.58rem] font-bold text-white/60">{trophies.toLocaleString()} trophies</div>
      </div>
    </div>
  );
}

function RankLadder({ trophies, streak }: { trophies: number; streak: number }) {
  const filled = Math.min(10, 4 + streak);
  return (
    <Panel className="h-full p-4">
      <SectionTitle accent="#ffd24a">League</SectionTitle>
      <div className="mt-2 flex items-center gap-3">
        <img src="/rank-bronze.png" alt="" className="h-14 w-14 object-contain drop-shadow" />
        <div>
          <div className="font-display text-lg font-extrabold text-amber-200">Bronze III</div>
          <div className="flex items-center gap-1 text-[0.66rem] font-bold text-white/70">
            <img src="/icons/coin.png" alt="" className="hidden h-3 w-3" />
            {trophies.toLocaleString()} trophies
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="text-sm" style={{ color: i < filled ? "#ffd24a" : "rgba(255,255,255,0.18)", textShadow: i < filled ? "0 0 6px rgba(255,210,74,0.7)" : undefined }}>
            {i < filled ? "★" : "☆"}
          </span>
        ))}
      </div>
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[0.55rem] font-bold text-white/45">
          <span>Bronze III</span>
          <span>Bronze II</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/15 bg-black/50">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-200" style={{ width: `${((trophies % TIER_TROPHIES) / TIER_TROPHIES) * 100}%` }} />
        </div>
        <div className="mt-1 text-right text-[0.55rem] text-white/45">{TIER_TROPHIES - (trophies % TIER_TROPHIES)} to promote</div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2">
        <img src="/egg-cosmic.png" alt="" className="h-9 w-9 object-contain" />
        <div className="leading-tight">
          <div className="text-[0.55rem] uppercase tracking-wide text-white/45">Next reward</div>
          <div className="font-display text-[0.78rem] font-extrabold text-fuchsia-200">Epic Egg</div>
        </div>
      </div>
    </Panel>
  );
}

function BattleItemsPanel({ items, setItems }: { items: string[]; setItems: (f: (x: string[]) => string[]) => void }) {
  const toggle = (id: string) => {
    sfx.click();
    setItems((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]));
  };
  return (
    <Panel className="h-full p-4">
      <div className="flex items-center justify-between">
        <SectionTitle accent="#c08bff">Battle Items</SectionTitle>
        <span className="text-[0.58rem] text-white/40">Equip before the fight</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {ITEMS.map((it) => {
          const on = items.includes(it.id);
          return (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              className="flex flex-col items-center gap-1 rounded-2xl border bg-black/30 p-2 transition hover:-translate-y-0.5"
              style={{ borderColor: on ? it.color : "rgba(255,255,255,0.1)", boxShadow: on ? `0 0 16px ${it.color}66, inset 0 0 12px ${it.color}33` : undefined }}
            >
              <span className="relative">
                <img src={it.img} alt="" className="h-11 w-11 object-contain drop-shadow" draggable={false} />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-ink-900 px-1 text-[0.5rem] font-bold text-white ring-1 ring-white/15">x{it.count}</span>
              </span>
              <span className="text-[0.56rem] font-extrabold text-white">{it.name}</span>
              <span className="text-[0.5rem] font-bold" style={{ color: it.color }}>{it.desc}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function WinRewards() {
  return (
    <Panel className="h-full p-4">
      <SectionTitle accent="#ffd24a">Win Rewards</SectionTitle>
      <div className="mt-3 space-y-2">
        <RewardRow img="/icons/coin.png" color="#ffd24a" label="+25 SOLAX" />
        <RewardRow img="/icons/dna.png" color="#d68bff" label="+5 DNA" />
        <RewardRow star color="#ffd24a" label="+15 XP" />
      </div>
      <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-center text-[0.62rem] font-bold text-emerald-200">
        Win 3 in a row for a bonus chest!
      </div>
    </Panel>
  );
}

function RewardRow({ img, star, color, label }: { img?: string; star?: boolean; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold" style={{ color }}>
      {star ? <span className="grid h-6 w-6 place-items-center text-base">★</span> : <img src={img} alt="" className="h-6 w-6 object-contain" />}
      {label}
    </div>
  );
}

function TeamTray({ world, team, myId, setMyId }: { world: WorldApi; team: Axol[]; myId: number | null; setMyId: (id: number) => void }) {
  const [paid, setPaid] = useState(0);
  useEffect(() => {
    const v = Number(window.localStorage?.getItem("arena_paid_slots"));
    if (!Number.isNaN(v) && v > 0) setPaid(Math.min(SLOT_PRICES.length, v));
  }, []);
  const capacity = Math.min(MAX_TEAM, FREE_SLOTS + paid);

  async function unlock(slotIndex: number) {
    if (slotIndex !== capacity) return;
    const price = SLOT_PRICES[slotIndex - FREE_SLOTS];
    const itemId = `arena-slot-${slotIndex + 1}`;
    if (!(await world.purchase(price, undefined, `Team slot ${slotIndex + 1}`, itemId))) {
      world.toast("Not enough SOLAX in wallet");
      return;
    }
    const next = paid + 1;
    setPaid(next);
    window.localStorage?.setItem("arena_paid_slots", String(next));
    sfx.coin();
    world.toast(`Team slot unlocked · ${price.toLocaleString()} SOLAX burned`);
  }

  return (
    <Panel className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle accent="#c08bff">Your Team</SectionTitle>
        <span className="text-[0.58rem] text-white/40">Tap to set your fighter · expand with SOLAX</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: MAX_TEAM }).map((_, i) => {
          if (i < capacity) {
            const a = team[i];
            if (!a) return <EmptySlot key={i} />;
            const active = myId === a.id;
            const cc = CLASS_META[a.cls].color;
            return (
              <button
                key={a.id}
                onClick={() => {
                  sfx.click();
                  setMyId(a.id);
                }}
                className="relative shrink-0 rounded-2xl border bg-black/30 p-2 text-center transition hover:-translate-y-0.5"
                style={{ width: 92, borderColor: active ? cc : "rgba(255,255,255,0.1)", boxShadow: active ? `0 0 18px ${cc}66` : undefined }}
              >
                <span className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: cc }} />
                <img src={axolSprite(a)} alt="" className="mx-auto h-14 w-14 object-contain" draggable={false} />
                <div className="font-display text-[0.66rem] font-extrabold text-white">{CLASS_META[a.cls].name}</div>
                <div className="text-[0.54rem] font-bold text-white/55">Lv.{a.level}</div>
                {active ? <div className="mt-0.5 rounded-full bg-brand-500/30 text-[0.5rem] font-extrabold uppercase tracking-wide text-brand-200">Selected</div> : null}
              </button>
            );
          }
          return <LockedSlot key={i} price={SLOT_PRICES[i - FREE_SLOTS]} active={i === capacity} onUnlock={() => unlock(i)} />;
        })}
      </div>
    </Panel>
  );
}

function EmptySlot() {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-black/30 p-2 text-white/30" style={{ width: 92, minHeight: 104 }}>
      <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-lg text-white/35">+</span>
      <div className="mt-1.5 text-[0.5rem] font-bold uppercase tracking-wide">Empty</div>
    </div>
  );
}

function LockedSlot({ price, active, onUnlock }: { price: number; active: boolean; onUnlock: () => void }) {
  return (
    <button
      onClick={active ? onUnlock : undefined}
      disabled={!active}
      className={`flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed bg-black/40 p-2 text-center transition ${active ? "hover:-translate-y-0.5" : "cursor-not-allowed opacity-60"}`}
      style={{ width: 92, minHeight: 104, borderColor: active ? "rgba(255,210,74,0.55)" : "rgba(255,255,255,0.12)", boxShadow: active ? "0 0 16px rgba(255,210,74,0.25)" : undefined }}
    >
      <span className={active ? "text-amber-300" : "text-white/30"}>
        <LockIcon />
      </span>
      {active ? (
        <>
          <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 ring-1 ring-amber-300/30">
            <img src="/icons/coin.png" alt="" className="h-3.5 w-3.5 object-contain" />
            <span className="font-display text-[0.62rem] font-extrabold text-amber-200">{price.toLocaleString()}</span>
          </span>
          <span className="text-[0.5rem] font-extrabold uppercase tracking-wide text-amber-300">Unlock</span>
        </>
      ) : (
        <span className="text-[0.5rem] font-bold uppercase tracking-wide text-white/30">Locked</span>
      )}
    </button>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function BattleLog({ log }: { log: ReplayEvent[] }) {
  return (
    <Panel className="p-4">
      <SectionTitle accent="#c08bff">Battle Log</SectionTitle>
      <div className="mt-2 space-y-1.5">
        {log.length === 0 ? <div className="text-[0.72rem] text-white/40">The battle is about to begin…</div> : null}
        {log.map((ev, i) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2.5 py-1 text-[0.72rem]">
            <span className={`font-bold ${ev.kind === "win" ? "text-emerald-300" : ev.side === "mine" ? "text-cyan-200" : "text-rose-200"}`}>
              {ev.text} {ev.sub ? <span className="text-amber-300">{ev.sub}</span> : null}
            </span>
            {ev.dmg ? <span className="shrink-0 font-display font-extrabold text-white/80">-{ev.dmg}</span> : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}
