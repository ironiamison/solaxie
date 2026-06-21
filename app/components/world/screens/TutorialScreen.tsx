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
            Think Axie-style progression with a neon island vibe: <b className="text-white">11 elemental classes</b>, five rarity tiers from Common to Cosmic,
            and a <b className="text-amber-300">pay-to-play</b> economy — buy SOLAX on pump.fun, burn it to progress, and earn a share of creator rewards through activity, not inflation.
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
            <li>Connected = full access — buy SOLAX on pump.fun, stack activity tickets for creator-reward share.</li>
            <li>Progress saves to cloud + your wallet — Solaxies are on-chain PDAs, profile data syncs via Vercel.</li>
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
            <li>Each hatch earns <b className="text-white">activity tickets</b> toward your creator-reward share.</li>
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
            <li><b className="text-white">Power Up</b> — level up instantly for a larger SOLAX burn (level-ups earn activity tickets).</li>
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
            <li>Breeding and hatching earn <b className="text-white">activity tickets</b> — rare bloodlines reward active breeders.</li>
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
          <p>Spend SOLAX on DNA packs, energy, eggs, boosters, and limited flash ships. Merchants rotate; harbor level unlocks better stock. Every purchase earns <b className="text-white">activity tickets</b>.</p>
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
            <li>Wins grant <b className="text-white">+5 DNA</b>, <b className="text-white">+40 XP</b>, and <b className="text-white">activity tickets</b> toward your creator-reward share.</li>
            <li>First 3 team slots are free; extra Arena slots unlock with SOLAX.</li>
            <li>Match real trainers when they&apos;re synced — cross-device rosters live with cloud save (Version 1.2).</li>
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
          <p className="mt-3 text-white/70">Trainer level rises as you play. Activity tickets stack in your profile from every action — season payouts scale with your ticket share once SOLAX is live.</p>
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
            Solaxie is <b className="text-white">pay-to-play</b> — not inflationary play-to-earn. You buy SOLAX on pump.fun and
            <b className="text-white"> burn</b> it to hatch, breed, shop, and power up. SOLAX stays a premium, deflationary asset while you compete on skill and activity.
          </p>

          <div className="my-4 rounded-2xl border border-violet-400/25 bg-violet-500/5 p-3 text-[0.74rem] text-white/70">
            <div className="mb-2 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-violet-200">Participation rewards</div>
            <p>
              Instead of minting new tokens to pay players, Solaxie uses a <b className="text-white">participation system powered by pump.fun creator rewards</b>.
              Every meaningful action — winning battles, breeding, hatching eggs, completing quests, trading on the Harbor Market, and leveling up — earns
              <b className="text-white"> activity tickets</b>. Tickets stack in your profile as you play; when seasons are fully active, your share determines creator-reward split.
            </p>
          </div>

          <div className="my-4 rounded-2xl border border-amber-300/25 bg-amber-400/5 p-3 text-[0.72rem]">
            <div className="mb-2 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-amber-200">The loop</div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-center font-bold text-white/80">
              <span className="rounded-lg bg-black/35 px-2 py-1">Buy SOLAX</span>
              <span className="text-white/35">→</span>
              <span className="rounded-lg bg-black/35 px-2 py-1">Burn to Play</span>
              <span className="text-white/35">→</span>
              <span className="rounded-lg bg-black/35 px-2 py-1">Earn Tickets</span>
              <span className="text-white/35">→</span>
              <span className="rounded-lg bg-black/35 px-2 py-1">Grow & Rank</span>
              <span className="text-white/35">→</span>
              <span className="rounded-lg bg-amber-400/20 px-2 py-1 text-amber-200">Creator Reward Share</span>
            </div>
          </div>

          <div className="mb-3 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-cyan-300/90">What earns tickets</div>
          <ul className="list-inside list-disc space-y-1.5 text-[0.74rem] text-white/70">
            <li><b className="text-white">Arena wins</b> — battle activity</li>
            <li><b className="text-white">Breeding & hatching</b> — new bloodlines and egg reveals</li>
            <li><b className="text-white">Quests</b> — daily island objectives</li>
            <li><b className="text-white">Harbor Market</b> — trades and flash-ship purchases</li>
            <li><b className="text-white">Level-ups</b> — feed, power-up, and trainer progression</li>
          </ul>

          <div className="mb-3 mt-5 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-rose-300/90">Where SOLAX burns</div>
          <ul className="list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">Feed & Power Up</b> — costs rise every level (~1.4× feed, ~1.7× power-up). High-level Solaxies are SOLAX sinks.</li>
            <li><b className="text-white">Breeding</b> — 2 free breeds per 5 hours; after that, 500k SOLAX + 1 egg per hatch.</li>
            <li><b className="text-white">Harbor Market</b> — DNA packs, eggs, energy crates, flash ships, daily deals.</li>
            <li><b className="text-white">Energy refills</b> — 100k SOLAX per 10 energy at the DNA Core when you want to keep spinning.</li>
          </ul>
          <p className="mt-2 text-[0.72rem] text-white/50">Burns keep demand on SOLAX as you progress — you cannot max everything for free.</p>

          <div className="mb-3 mt-5 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-emerald-300/90">Burn model (live)</div>
          <p className="text-white/70">
            <b className="text-white">SOLAX = your pump.fun token.</b> The top bar shows your real wallet balance.
            Every in-game spend sends an on-chain <b className="text-amber-300">burn</b> transaction — tokens are destroyed permanently, not sent to a dev wallet.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-[0.74rem] text-white/70">
            <li><b className="text-white">Mint</b> — 100k SOLAX burned per Solaxy</li>
            <li><b className="text-white">Breed</b> — 150k+ SOLAX burned (scales with parent breed count)</li>
            <li><b className="text-white">Feed / Power Up / Energy / Shop</b> — SOLAX burned from wallet</li>
            <li><b className="text-white">Island Economy meter</b> — tracks total burned across the island</li>
          </ul>
          <p className="mt-3 text-[0.72rem] text-white/50">
            Sustainable flywheel: play hard, burn SOLAX, stack tickets — creator rewards split by ticket share at season end (no inflationary minting).
          </p>
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
            ["SOLAX", "Pay-to-play currency — buy on pump.fun, burn for mints, feeds, breeding, market, and energy.", UI.coin],
            ["Activity tickets", "Earned from all activity; saved to profile for season participation share.", UI.flame],
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
    {
      id: "updates",
      title: "Updates",
      icon: UI.cosmic,
      accent: "#ff6bf0",
      body: (
        <div className="space-y-4">
          <p className="text-white/70">
            Patch notes for Solaxie island. New Solaxies, features, and fixes ship here first.
          </p>

          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 font-display text-[0.68rem] font-extrabold uppercase tracking-wide text-cyan-200">
                Version 1.3
              </span>
              <span className="text-[0.62rem] font-bold uppercase tracking-wide text-white/40">Coming soon</span>
            </div>
            <ul className="list-inside list-disc space-y-1.5 text-[0.74rem] text-white/70">
              <li><b className="text-white">Classic dex art pass</b> — replace color-filter echoes on the original 6 elements with unique illustrated sprites per form (same quality as Primal lines). Filters let us ship 85 forms fast; v1.3 makes every entry feel collectible.</li>
              <li><b className="text-white">Classified Solaxies</b> — unlock Zephyr, Nocturne, Mycelium, Solara, Glacier, and Mirage as a new season drop.</li>
              <li><b className="text-white">Player-to-player trading</b> — list and buy Solaxies from other trainers at the Harbor.</li>
              <li><b className="text-white">Settings</b> — audio, notifications, and account preferences.</li>
              <li><b className="text-white">Friends list</b> — follow trainers and see when they&apos;re in the Arena.</li>
              <li><b className="text-white">Full battle log &amp; achievements</b> — complete history and badge hall in Empire.</li>
              <li><b className="text-white">Harbor boosters</b> — wire XP potions, lucky charms, and epic odds items to actually affect rolls.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/5 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 font-display text-[0.68rem] font-extrabold uppercase tracking-wide text-fuchsia-200">
                Version 1.2
              </span>
              <span className="text-[0.62rem] font-bold uppercase tracking-wide text-emerald-300/80">Live now</span>
            </div>
            <ul className="list-inside list-disc space-y-1.5 text-[0.74rem] text-white/70">
              <li><b className="text-white">Unified progression system</b> — three separate tracks: Arena trophies (competitive W/L), trainer level (XP from all activity), and activity tickets (participation score).</li>
              <li><b className="text-white">Trainer XP wired</b> — battles, hatching, breeding, feeding, power-ups, market burns, energy refills, DNA bonus, and daily quests all grant trainer XP with level-ups.</li>
              <li><b className="text-white">Activity ticket tracking</b> — every meaningful action earns tickets; total saved to profile + cloud (visible in Empire &amp; profile dropdown).</li>
              <li><b className="text-white">Trophy leaderboard live</b> — global Arena rankings by trophies; visit other trainers&apos; Empire Halls.</li>
              <li><b className="text-white">Season payouts (pending SOLAX)</b> — pump.fun creator rewards shared by ticket share at season end; activates once token + vault init are live.</li>
              <li><b className="text-white">Retuned Arena leagues</b> — faster early promotions (Bronze IV at 1 trophy → Bronze III at 100 → 250 → 500 …); rank synced everywhere (profile, Arena, Empire).</li>
              <li><b className="text-white">Daily quest payouts</b> — complete all 3 quests for mystery egg + tickets + trainer XP once per UTC day.</li>
              <li><b className="text-white">Pay-to-play flywheel copy</b> — tutorial, wallet modal, SEO, and Island Economy meter explain burn + tickets (no inflationary P2E).</li>
              <li><b className="text-white">Arena rank fix</b> — removed fake demo trophy count; Arena reads real saved profile data.</li>
              <li><b className="text-white">Cloud save</b> — trainer profile (incl. tickets + XP), quests, pond layouts, and battle history sync via Vercel Blob (local dev uses browser + server memory).</li>
              <li><b className="text-white">On-chain program</b> — deployed on mainnet; mint/breed/battle go live once SOLAX launches on pump.fun and the vault is initialized.</li>
              <li><b className="text-white">SolaxyDex</b> — full creature compendium tab in Collection with progress bar and element filters.</li>
              <li><b className="text-white">85 playable forms</b> — base, Rare/Epic/Legendary echoes, Cosmic evolutions, and breed strains across all lines.</li>
              <li><b className="text-white">5 new Primal elements</b> — Crystal, Shadow, Mech, Ember, and Void, each with 5 illustrated evolution forms.</li>
              <li><b className="text-white">6 classified teasers</b> — future Solaxies visible in dex as locked Version 1.3 entries.</li>
              <li><b className="text-white">11 elements total</b> — new Primal triangle (Crystal → Mech → Ember) plus Shadow beats Void.</li>
              <li><b className="text-white">Pond arrange mode</b> — drag Solaxies on home pond and collection preview; separate layouts per view.</li>
              <li><b className="text-white">Release Solaxy</b> — permanently remove a creature from your roster and pond layout.</li>
              <li><b className="text-white">DNA bonus</b> — free DNA grant every 4 hours with cooldown timer and sound.</li>
              <li><b className="text-white">Battle rewards</b> — wins grant DNA, Solaxy XP, trainer XP, activity tickets, and trophy gains (+8 / −6).</li>
              <li><b className="text-white">Arena team slots</b> — 3 free fighters; slots 4–5 unlock for SOLAX.</li>
              <li><b className="text-white">Island economy meter</b> — unified “Total sunk” tracker; moved to bottom-right of home screen.</li>
              <li><b className="text-white">Breeding polish</b> — full-width hatch reveal when a Gen 2+ Solaxy hatches.</li>
              <li><b className="text-white">Sound pass</b> — feed, power-up, DNA bonus, and battle sfx polish.</li>
              <li><b className="text-white">Per-form sprites</b> — owned Solaxies display dex art for rarity, cosmic, and breed strain.</li>
              <li><b className="text-white">Twitter / SEO</b> — @solaxiedna linked site-wide with updated meta tags.</li>
              <li><b className="text-white">Bug fixes</b> — 10× spin badge clipping, pond layout save crash, white-screen dev cache issues, wallet login on local.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-display text-[0.68rem] font-extrabold uppercase tracking-wide text-white/80">
                Version 1.1
              </span>
              <span className="text-[0.62rem] font-bold uppercase tracking-wide text-white/40">First deploy</span>
            </div>
            <ul className="list-inside list-disc space-y-1.5 text-[0.74rem] text-white/70">
              <li><b className="text-white">Solaxie.com launch</b> — wallet login, island home, and core game loop live.</li>
              <li><b className="text-white">6 starter elements</b> — Beast, Plant, Aquatic, Bird, Bug, and Reptile with unique sprites.</li>
              <li><b className="text-white">DNA Core</b> — 1× and 10× spins, rarity tiers through Cosmic, energy refills.</li>
              <li><b className="text-white">Collection</b> — roster boxes, feed, power-up, set active, inspect stats and genes.</li>
              <li><b className="text-white">Nursery breeding</b> — two-parent hatches, compatibility preview, class mutations, breed limits.</li>
              <li><b className="text-white">Harbor Market</b> — merchants, flash ships, daily deals, DNA/egg/energy stock.</li>
              <li><b className="text-white">Arena battles</b> — class advantages, wild opponents, trophy tracking.</li>
              <li><b className="text-white">Empire Hall</b> — leagues, guild, battle history, trainer profile.</li>
              <li><b className="text-white">Global leaderboard</b> — cross-player rankings and visitable Empire Halls.</li>
              <li><b className="text-white">Real-player PvP</b> — match against other trainers’ rosters.</li>
              <li><b className="text-white">On-chain shop</b> — wallet-connected purchases via Anchor program.</li>
              <li><b className="text-white">Live feed</b> — global island activity stream.</li>
              <li><b className="text-white">Username prompt</b> — first-login trainer name setup.</li>
              <li><b className="text-white">Cosmic evolutions</b> — per-element cosmic cosmetic sprites.</li>
              <li><b className="text-white">Breed cosmetics</b> — 10 mutation body variants from breeding.</li>
            </ul>
          </div>
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
          <p className="truncate text-[0.62rem] text-white/50">Pay-to-play · Burn SOLAX · Earn activity tickets</p>
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
            Ready? Link your wallet — buy SOLAX to play, earn tickets, and compete for creator rewards.
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
