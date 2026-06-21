import { useEffect, useState, type ReactNode } from "react";
import { UI } from "@/lib/ui-icons";
import { sfx } from "@/lib/sfx";
import type { WorldApi } from "../world";
import { ProfileDropdown } from "../ProfileDropdown";
import { TwitterLink } from "../TwitterLink";
import { GameIcon } from "../GameIcon";

type Section = { id: string; title: string; icon: string; accent: string; body: ReactNode };

export default function TutorialScreen({ world }: { world: WorldApi }) {
  const [active, setActive] = useState("welcome");

  // Browsers block autoplay — start ambience on first tap anywhere on the tutorial.
  useEffect(() => {
    const unlock = () => {
      sfx.startAmbient();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const sections: Section[] = [
    {
      id: "welcome",
      title: "Welcome to Solaxie",
      icon: "/logo.png",
      accent: "#c08bff",
      body: (
        <>
          <p>
            Solaxie is a creature-collecting world on Solana. You hatch <b className="text-white">Solaxies</b>, breed new generations,
            battle rivals, and climb the empire ranks — all tied to your wallet as your permanent trainer profile.
          </p>
          <p className="mt-2">
            Think Axie-style progression with a neon island vibe: one pond, six elemental classes, five rarity tiers from Common to Cosmic,
            and a live economy powered by <b className="text-amber-300">SOLAX</b>.
          </p>
        </>
      ),
    },
    {
      id: "wallet",
      title: "Your Wallet = Your Login",
      icon: "/icons/coin.png",
      accent: "#54e07a",
      body: (
        <>
          <p>
            <b className="text-white">Link Wallet</b> is how you sign in. There is no separate account — your Solana wallet address
            stores your trainer name, Solaxies, SOLAX balance, battle history, and every upgrade.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-white/70">
            <li>Disconnected = tutorial only. You cannot roll, breed, battle, or shop.</li>
            <li>Connected = full access to the island and all buildings.</li>
            <li>Disconnect saves progress to your wallet slot; link again to pick up where you left off.</li>
          </ul>
          <button
            type="button"
            onClick={() => world.onConnect()}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 font-display text-base font-extrabold text-white shadow-glow transition hover:-translate-y-0.5"
          >
            Link Wallet to Start Playing
          </button>
        </>
      ),
    },
    {
      id: "home",
      title: "Your Pond (Home)",
      icon: UI.home,
      accent: "#3db4ff",
      body: (
        <>
          <p>The home screen is your floating island. Solaxies swim in the central pond; buildings around the map are shortcuts to every activity.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[0.72rem]">
            {[
              ["Arena Cave", "Battle wild challengers", UI.arena],
              ["DNA Shrine", "Opens the DNA Core", UI.shrine],
              ["Nursery Tree", "Breed two parents", UI.nursery],
              ["Harbor Market", "Buy supplies & deals", UI.market],
              ["Empire Hall", "Leagues, guild, history", UI.empire],
            ].map(([t, s, ic]) => (
              <div key={t} className="flex items-start gap-2.5 py-1">
                <GameIcon src={ic as string} size={24} glow="#c08bff" className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white">{t}</div>
                  <div className="text-white/50">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: "dnacore",
      title: "DNA Core — Hatch Solaxies",
      icon: UI.shrine,
      accent: "#a779ff",
      body: (
        <>
          <p>Spend <b className="text-white">DNA</b> and <b className="text-white">Energy</b> to spin the gene pool. Each spin reveals a new Solaxy with a random class and rarity.</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">1× Spin</b> — one reveal per press.</li>
            <li><b className="text-white">10× Spin</b> — batch roll; great for hunting Epic+.</li>
            <li><b className="text-white">Boosters</b> — optional luck charms before spinning (costs extra DNA).</li>
            <li><b className="text-white">Energy refill</b> — 100k SOLAX per 10 energy when you run dry.</li>
          </ul>
          <p className="mt-3 text-white/60">Rarities: Common → Rare → Epic → Legendary → Cosmic (1% jackpot).</p>
        </>
      ),
    },
    {
      id: "collection",
      title: "Collection — Your Roster",
      icon: UI.collection,
      accent: "#54e07a",
      body: (
        <>
          <p>Every Solaxy you own lives in the Collection. Tap a card to inspect stats, lineage, genes, and achievements.</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">Feed</b> — spend SOLAX for XP (cost scales with level).</li>
            <li><b className="text-white">Power Up</b> — level up instantly for a larger SOLAX burn.</li>
            <li><b className="text-white">Set Active</b> — pick your pond leader & battle default.</li>
            <li><b className="text-white">Breed</b> — opens the Nursery Tree with this Solaxy.</li>
          </ul>
          <p className="mt-3">Six stats matter in combat: HP, ATK, DEF, SPD, Skill, and Morale.</p>
        </>
      ),
    },
    {
      id: "breed",
      title: "Nursery Tree — Breeding",
      icon: UI.nursery,
      accent: "#ff5fb0",
      body: (
        <>
          <p>Pick <b className="text-white">Parent A</b> and <b className="text-white">Parent B</b>. Compatibility rises when classes pair well. The glowing egg shows what element the child might inherit.</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">2 free breeds</b> every 5 hours, then 500k SOLAX + 1 egg per extra breed.</li>
            <li>Children inherit generation from parents and can mutate to a new class (~15% chance).</li>
            <li>Each Solaxy has a limited breed count — plan your bloodlines.</li>
          </ul>
        </>
      ),
    },
    {
      id: "market",
      title: "Harbor Market — Economy",
      icon: UI.market,
      accent: "#2fe0cf",
      body: (
        <>
          <p>Spend SOLAX on DNA packs, energy, eggs, boosters, and limited flash ships. Merchants rotate; harbor level unlocks better stock.</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">Traveling merchants</b> — three NPC shops with different specialties.</li>
            <li><b className="text-white">Flash ships</b> — timed cargo with premium bundles.</li>
            <li><b className="text-white">Daily deal</b> — discounted mystery egg.</li>
            <li><b className="text-white">Black market</b> — unlocks at harbor level 16.</li>
          </ul>
        </>
      ),
    },
    {
      id: "battle",
      title: "Arena — Battles",
      icon: UI.arena,
      accent: "#b14bff",
      body: (
        <>
          <p>Send a Solaxy into the Arena Cave to fight a wild opponent. Class advantages matter: Beast beats Plant, Plant beats Aquatic, and so on.</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-white/70">
            <li>Each fight costs <b className="text-white">energy</b>.</li>
            <li>Wins feed daily quests and empire trophy count.</li>
            <li>Battle history is stored on your wallet profile in Empire Hall.</li>
          </ul>
        </>
      ),
    },
    {
      id: "empire",
      title: "Empire Hall — Status",
      icon: UI.empire,
      accent: "#ffb02e",
      body: (
        <>
          <p>Track your league rank, guild standing, chest progress, and battle log. Rename your empire and flex cosmetics from your profile menu.</p>
          <p className="mt-3 text-white/70">Trainer level rises as you play — higher level unlocks more market slots and ship tiers.</p>
        </>
      ),
    },
    {
      id: "flywheel",
      title: "SOLAX Flywheel",
      icon: UI.flame,
      accent: "#ff8a3d",
      body: (
        <>
          <p>
            SOLAX is the island&apos;s lifeblood. Every action you take either <b className="text-white">burns</b> it (removes it from circulation)
            or <b className="text-white">earns</b> you progress toward real rewards. That loop is the flywheel — spend to get stronger,
            compete to get paid, and grow the economy together.
          </p>

          <div className="my-4 rounded-2xl border border-amber-300/25 bg-amber-400/5 p-3 text-[0.72rem]">
            <div className="mb-2 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-amber-200">The loop</div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-center font-bold text-white/80">
              <span className="rounded-lg bg-black/35 px-2 py-1">Play</span>
              <span className="text-white/35">→</span>
              <span className="rounded-lg bg-black/35 px-2 py-1">Burn SOLAX</span>
              <span className="text-white/35">→</span>
              <span className="rounded-lg bg-black/35 px-2 py-1">Get Stronger</span>
              <span className="text-white/35">→</span>
              <span className="rounded-lg bg-black/35 px-2 py-1">Win & Rank Up</span>
              <span className="text-white/35">→</span>
              <span className="rounded-lg bg-amber-400/20 px-2 py-1 text-amber-200">Earn Rewards</span>
            </div>
          </div>

          <div className="mb-3 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-rose-300/90">Where SOLAX burns</div>
          <ul className="list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">Feed & Power Up</b> — costs rise every level (~1.4× feed, ~1.7× power-up). High-level Solaxies are SOLAX sinks.</li>
            <li><b className="text-white">Breeding</b> — 2 free breeds per 5 hours; after that, 500k SOLAX + 1 egg per hatch.</li>
            <li><b className="text-white">Harbor Market</b> — DNA packs, eggs, energy crates, flash ships, daily deals.</li>
            <li><b className="text-white">Energy refills</b> — 100k SOLAX per 10 energy at the DNA Core when you want to keep spinning.</li>
          </ul>
          <p className="mt-2 text-[0.72rem] text-white/50">Burns keep demand on SOLAX as you progress — you cannot max everything for free.</p>

          <div className="mb-3 mt-5 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-emerald-300/90">Who gets paid — exactly</div>
          <p className="text-white/70">
            Real SOLAX from the <b className="text-white">Island Treasury</b>. No vague &quot;seasonal rewards.&quot; Here is who wins, when, and for what:
          </p>

          <div className="mt-3 space-y-2.5">
            {[
              {
                who: "Global Top 10",
                when: "Every 3 days · 00:00 UTC",
                how: "Empire Hall → Global leaderboard. Ranked by trophies earned in that 3-day cycle.",
                payout: "#1 takes 25% of the cycle treasury. #2–#3 take 15% each. #4–#10 split the rest.",
                accent: "#ffd24a",
              },
              {
                who: "Anyone with 10 Arena wins",
                when: "Resets weekly with your Empire Chest",
                how: "Win 10 battles in the Arena Cave before the chest timer resets.",
                payout: "Guaranteed SOLAX drop + Epic Egg — paid straight from treasury the moment you hit 10/10.",
                accent: "#a779ff",
              },
              {
                who: "Daily quest finishers",
                when: "Every day · midnight UTC",
                how: "Complete all 3 daily quests (battle win, DNA roll, breed).",
                payout: "Mystery Egg + SOLAX stipend from the daily slice of treasury. Finish every day = stack free rolls.",
                accent: "#54e07a",
              },
              {
                who: "Hall of Legends holders",
                when: "1st of each month",
                how: "Top record in Empire Hall: Most Wins, Highest Level, Highest Gen, First Cosmic, Oldest bloodline.",
                payout: "One lump SOLAX payout per title — five winners, five cuts from the monthly treasury.",
                accent: "#3db4ff",
              },
            ].map((row) => (
              <div key={row.who} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-[0.82rem] font-extrabold text-white">{row.who}</span>
                  <span className="rounded-full px-2 py-0.5 text-[0.52rem] font-extrabold uppercase tracking-wide" style={{ background: `${row.accent}22`, color: row.accent }}>{row.when}</span>
                </div>
                <p className="mt-1.5 text-[0.72rem] text-white/55"><b className="text-white/75">How:</b> {row.how}</p>
                <p className="mt-1 text-[0.72rem] font-semibold" style={{ color: row.accent }}>{row.payout}</p>
              </div>
            ))}
          </div>

          <div className="mb-3 mt-5 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-brand-200/90">Where the money comes from</div>
          <p className="text-white/70">
            Every buy and sell of SOLAX on-chain generates <b className="text-white">creator rewards</b> (pump.fun trading fees).
            That is the <b className="text-amber-300">Island Treasury</b> — the prize pool. Not a dev wallet. Not a team cut.
            <b className="text-white"> 100% of creator rewards flow into treasury and get paid out to players</b> on the schedule above.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">More trading volume</b> → treasury grows → 3-day &amp; monthly payouts get bigger.</li>
            <li><b className="text-white">More players burning SOLAX in-game</b> → tighter supply → your winnings hit harder.</li>
            <li><b className="text-white">You do not need to hold a bag</b> to earn — climb leaderboard, fill your chest, finish quests, or hold a legend title.</li>
          </ul>

          <div className="mt-4 rounded-2xl border border-amber-300/35 bg-gradient-to-br from-amber-400/10 to-brand-500/10 p-4">
            <div className="font-display text-[0.68rem] font-extrabold uppercase tracking-widest text-amber-200">The pitch</div>
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-white/85">
              Traders fund the pool. Players fight over it. The more the island burns SOLAX and the more the token moves,
              the <b className="text-amber-200">bigger the Top 10 payout every 3 days</b> for whoever is actually playing — not whoever showed up first.
              Link wallet, win battles, and take your cut.
            </p>
          </div>
        </>
      ),
    },
    {
      id: "resources",
      title: "Resources Cheat Sheet",
      icon: UI.coin,
      accent: "#ffd24a",
      body: (
        <div className="space-y-2">
          {[
            ["SOLAX", "Main currency — feeds, power-ups, breeding fees, market buys, energy refills.", UI.coin],
            ["DNA", "Gene strands for DNA Core spins.", UI.dna],
            ["Eggs", "Required to breed after free daily breeds.", UI.egg],
            ["Energy", "Powers DNA spins and arena fights.", UI.energy],
          ].map(([name, desc, ic]) => (
            <div key={name} className="flex gap-3 py-1.5">
              <GameIcon src={ic as string} size={28} glow="#ffd24a" className="shrink-0" />
              <div>
                <div className="font-bold text-white">{name}</div>
                <div className="text-[0.72rem] text-white/60">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const current = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="fixed inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url(/home-bg.png)" }} />
      <div className="fixed inset-0 -z-10 bg-ink-900/88 backdrop-blur-sm" />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-ink-900/90 px-4 py-3 backdrop-blur">
        <img src="/logo.png" alt="Solaxie" className="h-9 object-contain" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-extrabold text-white">Solaxie Tutorial</h1>
          <p className="truncate text-[0.62rem] text-white/50">Learn the island · Link wallet to play</p>
        </div>
        <TwitterLink />
        <ProfileDropdown world={world} />
      </header>

      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-5 pb-32 lg:grid-cols-[240px_1fr]">
        <nav className="glass hidden max-h-[calc(100vh-8rem)] overflow-y-auto rounded-3xl p-2 lg:block">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={`mb-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[0.72rem] font-bold transition ${
                active === s.id ? "bg-brand-500/25 text-white shadow-glow" : "text-white/55 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <GameIcon src={s.icon} size={18} glow={active === s.id ? s.accent : undefined} />
              {s.title}
            </button>
          ))}
        </nav>

        <div className="glass rounded-3xl p-5 shadow-panel sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <GameIcon src={current.icon} size={40} glow={current.accent} className="shrink-0" />
            <div>
              <h2 className="font-display text-2xl font-extrabold text-white" style={{ color: current.accent }}>{current.title}</h2>
              <p className="text-[0.62rem] font-bold uppercase tracking-widest text-white/40">Guide · {sections.findIndex((s) => s.id === active) + 1} / {sections.length}</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-[0.84rem] leading-relaxed text-white/75">{current.body}</div>

          <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={`rounded-full px-3 py-1 text-[0.62rem] font-extrabold ${active === s.id ? "bg-brand-500 text-white" : "bg-white/10 text-white/55"}`}
              >
                {s.title.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-between gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              disabled={active === sections[0].id}
              onClick={() => setActive(sections[Math.max(0, sections.findIndex((s) => s.id === active) - 1)].id)}
              className="rounded-xl border border-white/15 px-4 py-2 text-[0.72rem] font-bold text-white/70 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={active === sections[sections.length - 1].id}
              onClick={() => setActive(sections[Math.min(sections.length - 1, sections.findIndex((s) => s.id === active) + 1)].id)}
              className="rounded-xl border border-white/15 px-4 py-2 text-[0.72rem] font-bold text-white/70 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-center text-[0.72rem] font-semibold text-white/55 sm:text-left">
            Ready? Link your wallet — it becomes your trainer profile and saves all progress.
          </p>
          <button
            type="button"
            onClick={() => void world.onConnect()}
            className="w-full shrink-0 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-3 font-display text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-0.5 sm:w-auto"
          >
            Link Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
