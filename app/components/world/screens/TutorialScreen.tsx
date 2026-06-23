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
            Think Axie-style progression with a neon island vibe: <b className="text-white">17 elemental classes</b> (6 classic, 5 Primal, 6 Classified), five rarity tiers from Common to Cosmic,
            and a <b className="text-amber-300">pay-to-play</b> economy — buy SOLAX on pump.fun, burn it to progress, and earn a share of creator rewards through activity, not inflation.
          </p>
          <p className="mt-2 text-[0.72rem] text-white/55">
            <b className="text-cyan-200">Version 1.3.1 is live</b> — Guest Island try mode, mobile HUD fixes, and ticket board polish. See <b className="text-white">Season 1 Guide</b> and <b className="text-white">Updates</b> in this tutorial.
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
            <li><b className="text-white">Try Guest Island</b> — play free with no wallet: spin, breed, battle, and explore. No saves, no SOLAX burns, no season tickets.</li>
            <li>Connected = full access — buy SOLAX on pump.fun, stack activity tickets for creator-reward share.</li>
            <li>Progress saves to cloud + your wallet — Solaxies are on-chain PDAs, profile data syncs via Vercel.</li>
          </ul>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => world.onTryGuest()}
              className="w-full rounded-2xl border border-cyan-400/40 bg-cyan-500/15 py-3 font-display text-base font-extrabold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-500/25"
            >
              Try Guest Island
            </button>
            <button
              type="button"
              onClick={() => world.onConnect()}
              className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 font-display text-base font-extrabold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Link Wallet
            </button>
          </div>
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
              ["Arena Cave", "Battle trainers · friend challenges", UI.arena],
              ["DNA Shrine", "Spins + Season 1 Classified drops", UI.shrine],
              ["Nursery Tree", "Breed two parents", UI.nursery],
              ["Harbor Market", "Shop + Player Market (P2P)", UI.market],
              ["Empire Hall", "Season board, friends, achievements", UI.empire],
              ["Collection", "SolaxyDex, list for sale", UI.collection],
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
            <li><b className="text-white">Season 1 Classified</b> — ~2.8% odds per spin for Zephyr, Nocturne, Mycelium, Solara, Glacier, or Mirage (see Empire season banner for countdown).</li>
            <li><b className="text-white">Boosters</b> — optional luck charms before spinning (costs extra DNA).</li>
            <li><b className="text-white">Energy refill</b> — 100k SOLAX per 10 energy when you run dry.</li>
            <li>Each hatch earns <b className="text-white">activity tickets</b> toward your creator-reward share.</li>
          </ul>
          <p className="mt-3 text-white/60">Rarities: Common → Rare → Epic → Legendary → Cosmic (1% jackpot). Primal &amp; Classified elements have unique sprites.</p>
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
            <li><b className="text-white">Set Active</b> — pick your pond leader &amp; battle default.</li>
            <li><b className="text-white">Breed</b> — opens the Nursery Tree with this Solaxy.</li>
            <li><b className="text-white">List on Player Market</b> — sell a Solaxy for SOLAX (50k listing fee burned; min 10,000 SOLAX price).</li>
            <li><b className="text-white">Release</b> — permanently remove a Solaxy from your roster.</li>
          </ul>
          <p className="mt-3 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-fuchsia-200/90">SolaxyDex tab</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-white/70">
            <li>Track all <b className="text-white">91+ playable forms</b> — filter by element, strains, or Classified.</li>
            <li><b className="text-white">Dex completion reward</b> — unlock every form in an element line for +2 eggs &amp; +120 activity tickets (one-time per line).</li>
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
          <p className="mt-2 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-cyan-200/90">Harbor Shop (default tab)</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">Traveling merchants</b> — three NPC shops with different specialties.</li>
            <li><b className="text-white">Flash ships</b> — timed cargo with premium bundles.</li>
            <li><b className="text-white">Daily deal</b> — discounted mystery egg.</li>
            <li><b className="text-white">Black market</b> — unlocks at harbor level 16.</li>
          </ul>
          <p className="mt-3 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-cyan-200/90">Player Market tab (v1.3)</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">Buy Solaxies</b> — browse listings from other trainers (5% sale tax burned).</li>
            <li><b className="text-white">Market watch</b> — toggle element chips to get alerts when that class is listed.</li>
            <li><b className="text-white">Friend listings</b> — auto-toast when someone you follow lists a Solaxy (Settings → Notifications must be on).</li>
            <li>List from <b className="text-white">Collection</b> → select a Solaxy → <b className="text-white">List on Player Market</b>.</li>
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
          <p>Send a Solaxy into the Arena Cave to fight wild opponents or <b className="text-white">real trainers</b>. Class advantages matter: Beast beats Plant, Plant beats Aquatic, and so on — plus Primal and Classified triangles.</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-white/70">
            <li>Each fight costs <b className="text-white">energy</b>.</li>
            <li>Wins grant <b className="text-white">+5 DNA</b>, <b className="text-white">+40 XP</b>, trophies (+8 / −6), and <b className="text-white">activity tickets</b>.</li>
            <li>First 3 team slots are free; extra Arena slots unlock with SOLAX.</li>
            <li><b className="text-white">Find Opponent</b> — matches live trainers when synced to the global registry.</li>
            <li><b className="text-white">Friend challenge (⚔)</b> — from Empire Hall, Global leaderboard, or Friends tab → sends you here for a direct duel vs their champion.</li>
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
          <p>Track your league rank, season progress, social graph, and legacy. Rename your empire and flex cosmetics from your profile menu.</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">Season 1 banner</b> — Classified drop odds, countdown, your tickets &amp; estimated creator-reward share %.</li>
            <li><b className="text-white">Economy ticker</b> — live SOLAX sunk in-game, 24h DEX volume, market cap.</li>
            <li><b className="text-white">Season Ticket Board</b> — global ticket rankings, pool total, your rank &amp; share.</li>
            <li><b className="text-white">Leaderboard panel</b> — Global (trophies), Empire (power), Friends tabs · <b className="text-white">+</b> to follow · <b className="text-white">⚔</b> to challenge.</li>
            <li><b className="text-white">Hall of Legends</b> — your oldest, highest level, rarest, and highest-gen Solaxies.</li>
            <li><b className="text-white">Achievements</b> — badge hall with progress (Classified Clearance, Dex Scholar, Harbor Trader, etc.).</li>
            <li><b className="text-white">Battle History</b> — recent fights · <b className="text-white">View Full History</b> for complete log.</li>
            <li><b className="text-white">Visit Empire</b> — tap any trainer on the leaderboard to tour their hall · <b className="text-white">Challenge to Arena</b> from their profile.</li>
            <li><b className="text-white">Empire Chest</b> — win battles to unlock egg rewards.</li>
          </ul>
          <p className="mt-3 text-white/60">Trainer level rises as you play. Activity tickets stack from every action — season payouts scale with your ticket share at season end.</p>
        </>
      ),
    },
    {
      id: "season1",
      title: "Season 1 Guide (v1.3)",
      icon: "/sprites/dex/unreleased-mirage.png",
      accent: "#2fe0cf",
      body: (
        <>
          <p>
            <b className="text-white">Season 1: Classified</b> is live. Here is every v1.3 feature and exactly where to find it in-game.
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-[0.68rem]">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-[0.58rem] font-extrabold uppercase tracking-wide text-white/45">
                  <th className="px-3 py-2">Feature</th>
                  <th className="px-3 py-2">Where to find it</th>
                </tr>
              </thead>
              <tbody className="text-white/75">
                {[
                  ["Classified DNA drops", "DNA Core spins · Empire season banner"],
                  ["6 Classified elements", "SolaxyDex → Classified filter · Collection"],
                  ["Season countdown & share %", "Empire → top Season 1 banner"],
                  ["Live economy stats", "Empire → economy ticker (SOLAX sunk, DEX vol)"],
                  ["Global ticket leaderboard", "Empire → Season Ticket Board"],
                  ["Follow trainers", "Empire → Global tab → + on a row"],
                  ["Friends list", "Empire → Friends tab"],
                  ["Challenge duel (⚔)", "Empire visit · leaderboard · Friends tab → Arena"],
                  ["Player Market (buy)", "Harbor → Player Market tab"],
                  ["List Solaxy for sale", "Collection → select Solaxy → List on Player Market"],
                  ["Market watch alerts", "Harbor → Player Market → element chips"],
                  ["Friend listing toasts", "Automatic when following (Settings → Notifications)"],
                  ["Achievements / badges", "Empire → Achievements tab"],
                  ["Full battle history", "Empire → Battle History → View Full History"],
                  ["Hall of Legends", "Empire → center bottom panel"],
                  ["Dex completion rewards", "SolaxyDex — complete a full element line"],
                  ["Demo mode (testing)", "Connect wallet Hd6svr…SEpo — unlimited, no burns"],
                ].map(([feat, where]) => (
                  <tr key={feat} className="border-b border-white/5 even:bg-white/[0.02]">
                    <td className="px-3 py-2 font-semibold text-white">{feat}</td>
                    <td className="px-3 py-2 text-white/60">{where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[0.72rem] text-white/55">
            Classified elements: <b className="text-white">Zephyr · Nocturne · Mycelium · Solara · Glacier · Mirage</b>.
            Player Market burns 50k SOLAX to list + 5% tax on sales. Stack tickets before season end for creator-reward share.
            See <b className="text-white">Updates</b> for the Version 1.4 roadmap.
          </p>
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
            <li><b className="text-white">Player Market</b> — listing fees and sale taxes (burned SOLAX)</li>
            <li><b className="text-white">Level-ups</b> — feed, power-up, and trainer progression</li>
          </ul>

          <div className="mb-3 mt-5 font-display text-[0.62rem] font-extrabold uppercase tracking-widest text-rose-300/90">Where SOLAX burns</div>
          <ul className="list-inside list-disc space-y-1.5 text-white/70">
            <li><b className="text-white">Feed & Power Up</b> — costs rise every level (~1.4× feed, ~1.7× power-up). High-level Solaxies are SOLAX sinks.</li>
            <li><b className="text-white">Breeding</b> — 2 free breeds per 5 hours; after that, 500k SOLAX + 1 egg per hatch.</li>
            <li><b className="text-white">Harbor Market</b> — DNA packs, eggs, energy crates, flash ships, daily deals.</li>
            <li><b className="text-white">Player Market</b> — 50k SOLAX listing fee + 5% sale tax (all burned).</li>
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
            ["Player listings", "Sell Solaxies on Harbor → Player Market; 50k list fee burned.", UI.market],
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

          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-display text-[0.68rem] font-extrabold uppercase tracking-wide text-emerald-200">
                Version 1.3.1
              </span>
              <span className="text-[0.62rem] font-bold uppercase tracking-wide text-emerald-300/80">Live now</span>
            </div>
            <p className="mb-2 text-[0.72rem] text-white/55">Mobile polish + try-before-you-connect — play the full island on phone without wallet overlap or clipping.</p>
            <ul className="list-inside list-disc space-y-1.5 text-[0.74rem] text-white/70">
              <li><b className="text-white">Try Guest Island</b> — free play mode from the tutorial: spin, breed, battle, and explore with no wallet connect. No cloud saves, SOLAX burns, or season tickets until you link Phantom.</li>
              <li><b className="text-white">Guest vs linked</b> — Player Market listings, friends follow, and cloud sync require a linked wallet; everything else works in guest mode for demos.</li>
              <li><b className="text-white">Burner wallet removed from live site</b> — the dev-only &quot;Burner (Local)&quot; test wallet no longer appears on solaxie.com; Phantom and Solflare only in production.</li>
              <li><b className="text-white">Mobile HUD redesign</b> — two-row top bar on home: logo + avatar on top, scrollable SOLAX / DNA / Eggs / Energy strip below. Stats no longer stack on top of each other on iPhone.</li>
              <li><b className="text-white">Avatar-only profile on phone</b> — trainer name and rank move into the profile menu so the top-right corner stays compact and tappable.</li>
              <li><b className="text-white">Island hotspot clearance</b> — Arena, Breed, Harbor, and Empire buttons sit below the HUD so building labels and taps don&apos;t overlap resource counters.</li>
              <li><b className="text-white">Compact bottom nav</b> — icons-only on mobile; all six tabs fit without horizontal clipping. Safe-area padding for the iPhone home indicator.</li>
              <li><b className="text-white">Sub-screen mobile headers</b> — Arena, DNA Core, Collection, Market, Empire, and Settings use the same compact layout: title row + scrollable resource chips + bottom nav clearance on scroll.</li>
              <li><b className="text-white">Collection mobile search</b> — search bar moves into the page body on phone so filters don&apos;t crowd the sticky header.</li>
              <li><b className="text-white">Safe-area support</b> — notch and home-indicator padding on tutorial, pond arrange, toasts, and bottom dock (<code className="text-emerald-200/80">viewport-fit=cover</code>).</li>
              <li><b className="text-white">Toasts &amp; modals</b> — notification toasts sit above the bottom nav; breed and system modals layer on top so taps aren&apos;t stolen by the dock.</li>
              <li><b className="text-white">Economy meter repositioned</b> — mobile &quot;Sunk&quot; chip moved to bottom-left so it doesn&apos;t fight the Harbor Market hotspot on the right.</li>
              <li><b className="text-white">Ticket board accuracy</b> — Season Ticket Board sorts by live ticket totals; registry and leaderboard polling optimized so refreshes don&apos;t stall the page.</li>
              <li><b className="text-white">Harbor &amp; DNA polish</b> — shopkeeper speech bubble reflows on narrow screens; 10× spin discount badge no longer clips against the sticky header.</li>
              <li><b className="text-white">Arena mobile stage</b> — slightly shorter battle stage on small phones so speed controls and fighters stay visible above the nav.</li>
              <li><b className="text-white">Local dev stability</b> — lighter leaderboard payloads in dev; run <code className="text-emerald-200/80">npm run dev:clean</code> if localhost white-screens after heavy testing.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-display text-[0.68rem] font-extrabold uppercase tracking-wide text-amber-200">
                Version 1.2.1
              </span>
              <span className="text-[0.62rem] font-bold uppercase tracking-wide text-emerald-300/80">Live now</span>
            </div>
            <p className="mb-2 text-[0.72rem] text-white/55">Launch-week stability pass — wallet economy, saves, and spends hardened for mainnet.</p>
            <ul className="list-inside list-disc space-y-1.5 text-[0.74rem] text-white/70">
              <li><b className="text-white">SOLAX economy live</b> — in-game spends transfer real pump.fun SOLAX (Token-2022) to the public burn wallet; every purchase, feed, power-up, and market buy sinks tokens on-chain.</li>
              <li><b className="text-white">Wallet balance accuracy</b> — top bar and Harbor now read your live SPL balance with multi-RPC fallback so SOLAX displays correctly across devices.</li>
              <li><b className="text-white">Spend flow polish</b> — feed, power-up, Harbor, and energy refills reliably open your wallet for approval; balance refreshes before each transaction.</li>
              <li><b className="text-white">Cloud roster backup</b> — trainer profile, Solaxy roster, DNA/eggs/energy, pond layouts, and battle history sync to cloud; reconnect on a new browser or device to pick up where you left off.</li>
              <li><b className="text-white">Registry restore</b> — if local cache is cleared, your island can rebuild from the global trainer registry on wallet connect.</li>
              <li><b className="text-white">Settings</b> — audio, notification toasts, wallet copy, and disconnect (profile menu → Settings).</li>
              <li><b className="text-white">Harbor boosters</b> — lucky charms and odds items bought at Market apply to DNA Core spins; XP potions grant instantly.</li>
              <li><b className="text-white">Launch airdrop</b> — one-time +5 eggs and +4 breed slots per Solaxy for early trainers.</li>
              <li><b className="text-white">Nursery eggs</b> — new islands start with 5 eggs; trainers missing eggs from a save sync get a one-time +8 restock on login.</li>
              <li><b className="text-white">Energy refill</b> — one-time full stamina restore for every trainer on next login.</li>
              <li><b className="text-white">24h energy boost</b> — max energy raised to 500 for the first 24 hours after launch (countdown on the energy bar).</li>
              <li><b className="text-white">Primal art</b> — Crystal, Ember, and other Primal pulls render cleanly on DNA reveal and in Collection.</li>
              <li><b className="text-white">Copy &amp; UX</b> — play-and-earn messaging, trainer names without .sol suffix, battle energy aligned with UI, and clearer spend toasts.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 font-display text-[0.68rem] font-extrabold uppercase tracking-wide text-cyan-200">
                Version 1.3
              </span>
              <span className="text-[0.62rem] font-bold uppercase tracking-wide text-emerald-300/80">Live now</span>
            </div>
            <p className="mb-2 text-[0.72rem] text-white/55">Season 1: Classified — new elements, player trading, friends, and Empire progression.</p>
            <ul className="list-inside list-disc space-y-1.5 text-[0.74rem] text-white/70">
              <li><b className="text-white">Classified Solaxies</b> — Zephyr, Nocturne, Mycelium, Solara, Glacier, and Mirage drop from DNA Core during Season 1.</li>
              <li><b className="text-white">Season 1 banner</b> — countdown, ticket share estimate, and live economy ticker on Empire.</li>
              <li><b className="text-white">Player-to-player trading</b> — list Solaxies from Collection; buy at Harbor → Player Market tab.</li>
              <li><b className="text-white">Friends list</b> — follow trainers from Global leaderboard; see friends in Empire.</li>
              <li><b className="text-white">Battle log &amp; achievements</b> — full history modal and badge hall in Empire.</li>
              <li><b className="text-white">Hall of Legends</b> — dynamic slots from your roster stats.</li>
              <li><b className="text-white">Classic dex art pass</b> — per-element hue pipelines for unique Rare/Epic/Legendary echoes (<code className="text-cyan-200/80">npm run generate:dex</code>).</li>
              <li><b className="text-white">Dex completion rewards</b> — +2 eggs &amp; +120 tickets for unlocking every form in an element line.</li>
              <li><b className="text-white">Friend challenge duels</b> — ⚔ from Empire Hall or leaderboard to fight a followed trainer in Arena.</li>
              <li><b className="text-white">Market watch alerts</b> — toast when friends list or a watched class hits Player Market.</li>
              <li><b className="text-white">Global ticket leaderboard</b> — live season ticket totals and estimated creator-reward share on Empire.</li>
              <li><b className="text-white">Demo deployer wallet</b> — unlimited resources &amp; no SOLAX burns for testing.</li>
              <li><b className="text-white">Stability pass</b> — Empire crash fix, wallet disconnect debounce, skeleton loaders for ticker/ticket board, dev cache clean script (<code className="text-cyan-200/80">npm run dev:clean</code>).</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-violet-400/25 bg-violet-500/5 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 font-display text-[0.68rem] font-extrabold uppercase tracking-wide text-violet-200">
                Version 1.4
              </span>
              <span className="text-[0.62rem] font-bold uppercase tracking-wide text-white/40">Planned · roadmap</span>
            </div>
            <p className="mb-2 text-[0.72rem] text-white/55">What we&apos;re eyeing next — subject to change based on Season 1 data and community feedback.</p>
            <ul className="list-inside list-disc space-y-1.5 text-[0.74rem] text-white/70">
              <li><b className="text-white">Season 1 payout execution</b> — on-chain SOLAX creator-reward distribution to ticket holders at season snapshot.</li>
              <li><b className="text-white">Classified evolution lines</b> — full 5-form dex entries for all 6 Classified elements (like Primal quality).</li>
              <li><b className="text-white">Hand-illustrated dex finish</b> — unique art for every classic &amp; Classified form, replacing filter-based echoes.</li>
              <li><b className="text-white">Guild wars &amp; brackets</b> — scheduled team tournaments with bonus tickets and Empire prestige.</li>
              <li><b className="text-white">Auction house</b> — timed bids on rare Solaxies beyond fixed-price Player Market listings.</li>
              <li><b className="text-white">Empire customization</b> — burn SOLAX to decorate your Hall and pond with season cosmetics.</li>
              <li><b className="text-white">Expanded quest board</b> — weekly Empire quests, streak bonuses, and season milestone tracks.</li>
              <li><b className="text-white">Battle replay sharing</b> — save and share Arena replay links; spectate top-trainer matches.</li>
              <li><b className="text-white">Push &amp; email alerts</b> — market watches, friend challenges, and season events outside the browser tab.</li>
              <li><b className="text-white">On-chain Solaxy NFTs</b> — optional Metaplex wrap for top Solaxies to trade on external marketplaces.</li>
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
              <li><b className="text-white">Play-and-earn messaging</b> — tutorial, wallet modal, SEO, and Island Economy meter explain activity tickets and on-chain SOLAX sinks.</li>
              <li><b className="text-white">Arena rank fix</b> — removed fake demo trophy count; Arena reads real saved profile data.</li>
              <li><b className="text-white">Cloud save</b> — trainer profile (incl. tickets + XP), quests, pond layouts, and battle history sync via Vercel Blob (local dev uses browser + server memory).</li>
              <li><b className="text-white">On-chain program</b> — deployed on mainnet; mint/breed/battle go live once SOLAX launches on pump.fun and the vault is initialized.</li>
              <li><b className="text-white">SolaxyDex</b> — full creature compendium tab in Collection with progress bar and element filters.</li>
              <li><b className="text-white">85 playable forms</b> — base, Rare/Epic/Legendary echoes, Cosmic evolutions, and breed strains across all lines.</li>
              <li><b className="text-white">5 new Primal elements</b> — Crystal, Shadow, Mech, Ember, and Void, each with 5 illustrated evolution forms.</li>
              <li><b className="text-white">Classified teasers</b> — later shipped live as Season 1 in Version 1.3.</li>
              <li><b className="text-white">17 elements total</b> — classic 6 + Primal 5 + Classified 6 (Season 1).</li>
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

      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-ink-900/90 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-4 sm:py-3 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]">
        <img src="/logo.png" alt="Solaxie" className="h-8 shrink-0 object-contain sm:h-9" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-base font-extrabold text-white sm:text-lg">Solaxie Tutorial</h1>
          <p className="truncate text-[0.58rem] text-white/50 sm:text-[0.62rem]">Play and earn activity tickets</p>
        </div>
        <TutorialMuteButton />
        <TwitterLink className="hidden sm:inline-flex" />
        <ProfileDropdown world={world} />
      </header>

      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-5 pb-44 lg:grid-cols-[240px_1fr] lg:pb-32">
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

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-center text-[0.72rem] font-semibold text-white/55 sm:text-left">
            New here? Try Guest Island free — or link Phantom to save progress and earn season tickets.
          </p>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => world.onTryGuest()}
              className="w-full rounded-2xl border border-cyan-400/40 bg-cyan-500/15 px-6 py-3 font-display text-sm font-extrabold text-cyan-100 transition hover:-translate-y-0.5 sm:w-auto"
            >
              Try Guest Island
            </button>
            <button
              type="button"
              onClick={() => void world.onConnect()}
              className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-3 font-display text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-0.5 sm:w-auto"
            >
              Link Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorialMuteButton() {
  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(sfx.isMuted()), []);
  return (
    <button
      type="button"
      onClick={() => {
        const nowMuted = sfx.toggleMuted();
        setMuted(nowMuted);
        if (!nowMuted) sfx.startAmbient();
      }}
      aria-label={muted ? "Unmute" : "Mute"}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-ink-900/75 text-base shadow-md backdrop-blur transition hover:border-white/40"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
