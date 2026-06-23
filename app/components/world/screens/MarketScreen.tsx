import { useEffect, useMemo, useRef, useState } from "react";
import { AxolClass, CLASS_META, RARITY_META, Rarity, randomAxol } from "@/lib/game";
import type { Resources } from "@/lib/game";
import { UI } from "@/lib/ui-icons";
import { sfx } from "@/lib/sfx";
import type { WorldApi } from "../world";
import { Panel, ScreenShell, ScreenTop, SectionTitle } from "../ScreenChrome";
import { CloseIcon, GameIcon } from "../GameIcon";
import { ModalPortal } from "../ModalPortal";
import { MarketplacePanel } from "../MarketplacePanel";

// ---------------------------------------------------------------------------
// data
// ---------------------------------------------------------------------------

type Item = {
  id: string;
  name: string;
  icon?: string;
  img?: string;
  price: number;
  was?: number;
  rarity: Rarity;
  note?: string;
  reward?: Partial<Resources>;
  addAxol?: Rarity;
  stock?: number;
};

type Merchant = {
  id: string;
  name: string;
  title: string;
  img: string;
  accent: string;
  greeting: string;
  items: Item[];
};

const MERCHANTS: Merchant[] = [
  {
    id: "egg",
    name: "Pip",
    title: "Egg Merchant",
    img: "/merchant-egg.png",
    accent: "#ffd24a",
    greeting: "Fresh eggs, laid this very morning! Pick a lucky one~",
    items: [
      { id: "egg-c", name: "Common Egg", img: "/egg-cosmic.png", price: 850, rarity: "Common", reward: { eggs: 1 } },
      { id: "egg-m", name: "Mystery Egg", img: "/egg-cosmic.png", price: 3200, was: 5200, rarity: "Epic", reward: { eggs: 1 } },
      { id: "egg-cos", name: "Cosmic Egg", img: "/egg-cosmic.png", price: 9900, rarity: "Legendary", reward: { eggs: 1 } },
    ],
  },
  {
    id: "gene",
    name: "Dr. Splice",
    title: "Geneticist",
    img: "/merchant-gene.png",
    accent: "#3db4ff",
    greeting: "The helix never lies. More DNA, more destiny.",
    items: [
      { id: "g1", name: "Gene Strands ×5", icon: UI.shrine, price: 520, rarity: "Common", note: "+5 DNA", reward: { dna: 5 } },
      { id: "g2", name: "DNA Pack ×10", icon: UI.dna, price: 1400, rarity: "Rare", note: "+10 DNA", reward: { dna: 10 } },
      { id: "g3", name: "DNA Vault ×25", icon: UI.dna, price: 3200, rarity: "Epic", note: "+25 DNA", reward: { dna: 25 } },
    ],
  },
  {
    id: "alch",
    name: "Ziv",
    title: "Alchemist",
    img: "/merchant-alchemist.png",
    accent: "#a779ff",
    greeting: "Bubble, bubble... fancy a little boost, friend?",
    items: [
      { id: "a1", name: "XP Potion (S)", icon: UI.potion, price: 420, rarity: "Common", note: "+1,000 XP" },
      { id: "a2", name: "XP Potion (L)", icon: UI.potion, price: 1050, rarity: "Rare", note: "+2,500 XP" },
      { id: "a3", name: "Lucky Charm", icon: UI.clover, price: 630, rarity: "Rare", note: "+10% luck" },
      { id: "a4", name: "Epic Booster", icon: UI.orb, price: 1550, rarity: "Epic", note: "+25% Epic odds" },
    ],
  },
  {
    id: "supply",
    name: "Bundle",
    title: "Supply Trader",
    img: "/merchant-supply.png",
    accent: "#54e07a",
    greeting: "Stocked up for any voyage. What'll it be, captain?",
    items: [
      { id: "s1", name: "Energy Refill", icon: UI.energy, price: 1050, rarity: "Rare", note: "Full energy", reward: { energy: 9999 } },
      { id: "s2", name: "Field Rations", icon: UI.meat, price: 630, rarity: "Common", note: "+40 energy", reward: { energy: 40 } },
      { id: "s3", name: "Starter Pack", icon: UI.crate, price: 2450, rarity: "Legendary", note: "2 Eggs + 10 DNA", reward: { eggs: 2, dna: 10 } },
    ],
  },
];

// special rotating merchants (every 6h)
const SPECIALS: Merchant[] = [
  {
    id: "prof",
    name: "Professor Axol",
    title: "Visiting Scholar",
    img: "/merchant-professor.png",
    accent: "#ffd24a",
    greeting: "Ah, a curious mind! I've brought specimens of exceptional pedigree.",
    items: [
      { id: "p1", name: "Legendary Egg", img: "/egg-cosmic.png", price: 7800, was: 11200, rarity: "Legendary", reward: { eggs: 1 }, stock: 3 },
      { id: "p2", name: "Cosmic DNA ×5", icon: UI.dna, price: 5600, rarity: "Cosmic", note: "+30 DNA", reward: { dna: 30 }, stock: 5 },
      { id: "p3", name: "Rare Booster", icon: UI.orb, price: 2800, rarity: "Epic", note: "+40% Epic+ odds", stock: 4 },
    ],
  },
  {
    id: "coral",
    name: "Captain Coral",
    title: "Tide Runner",
    img: "/shopkeeper.png",
    accent: "#2fe0cf",
    greeting: "Caught these on the deep current, friend. Won't last the tide!",
    items: [
      { id: "c1", name: "Mystery Egg", img: "/egg-cosmic.png", price: 2700, was: 5200, rarity: "Epic", reward: { eggs: 1 }, stock: 6 },
      { id: "c2", name: "Energy Crate", icon: UI.energy, price: 1750, rarity: "Rare", note: "Full + 50 energy", reward: { energy: 9999 }, stock: 5 },
      { id: "c3", name: "Pearl of Luck", icon: UI.pearl, price: 2250, rarity: "Epic", note: "+20% luck", stock: 3 },
    ],
  },
  {
    id: "mad",
    name: "Mad Alchemist",
    title: "Unhinged Genius",
    img: "/merchant-alchemist.png",
    accent: "#a779ff",
    greeting: "IT'S ALIVE! Erm— I mean... potions! Half off! Mostly stable!",
    items: [
      { id: "m1", name: "Mega XP Brew", icon: UI.potion, price: 1550, was: 2800, rarity: "Epic", note: "+6,000 XP", stock: 4 },
      { id: "m2", name: "Chaos Booster", icon: UI.shrine, price: 2100, rarity: "Legendary", note: "+50% rare odds", stock: 2 },
      { id: "m3", name: "Gene Splice ×15", icon: UI.dna, price: 1950, rarity: "Rare", note: "+15 DNA", reward: { dna: 15 }, stock: 8 },
    ],
  },
  {
    id: "nomad",
    name: "Nomad Trader",
    title: "Desert Wanderer",
    img: "/merchant-supply.png",
    accent: "#ffa83d",
    greeting: "Travelled far across the dunes. These wares are one of a kind.",
    items: [
      { id: "n1", name: "Wanderer's Pack", img: "/egg-cosmic.png", price: 4200, was: 6300, rarity: "Legendary", note: "Egg + 20 DNA", reward: { eggs: 1, dna: 20 }, stock: 3 },
      { id: "n2", name: "Sun Charm", icon: UI.sun, price: 1250, rarity: "Epic", note: "+15% luck", stock: 5 },
      { id: "n3", name: "Caravan Bundle", icon: UI.crate, price: 3500, rarity: "Epic", note: "3 Eggs + 15 DNA", reward: { eggs: 3, dna: 15 }, stock: 4 },
    ],
  },
];

type Ship = { id: string; name: string; badgeIcon: string; img: string; accent: string; periodMs: number; items: Item[] };
const HOUR = 3600_000;
const SHIPS: Ship[] = [
  {
    id: "pirate",
    name: "Pirate Ship",
    badgeIcon: UI.flag,
    img: "/ship-pirate.png",
    accent: "#9aa4b2",
    periodMs: 2 * HOUR,
    items: [
      { id: "ps1", name: "Loot Crate", icon: UI.coin, price: 31500, rarity: "Rare", note: "+25 DNA", reward: { dna: 25 } },
      { id: "ps2", name: "Black Egg", img: "/egg-cosmic.png", price: 108000, rarity: "Epic", reward: { eggs: 1 } },
      { id: "ps3", name: "Plunder DNA", icon: UI.dna, price: 37500, rarity: "Rare", note: "+12 DNA", reward: { dna: 12 } },
    ],
  },
  {
    id: "fleet",
    name: "Merchant Fleet",
    badgeIcon: UI.ship,
    img: "/ship-fleet.png",
    accent: "#3db4ff",
    periodMs: 6 * HOUR,
    items: [
      { id: "fl1", name: "Cargo of Eggs", img: "/egg-cosmic.png", price: 189000, was: 252000, rarity: "Epic", note: "3 Eggs", reward: { eggs: 3 } },
      { id: "fl2", name: "DNA Shipment", icon: UI.dna, price: 81000, rarity: "Epic", note: "+25 DNA", reward: { dna: 25 } },
      { id: "fl3", name: "Energy Barrels", icon: UI.energy, price: 54000, rarity: "Rare", note: "Full energy", reward: { energy: 9999 } },
    ],
  },
  {
    id: "caravan",
    name: "Golden Caravan",
    badgeIcon: UI.cosmic,
    img: "/ship-caravan.png",
    accent: "#ffd24a",
    periodMs: 12 * HOUR,
    items: [
      { id: "gc1", name: "Golden Egg", img: "/egg-cosmic.png", price: 378000, was: 546000, rarity: "Legendary", reward: { eggs: 1 }, stock: 2 },
      { id: "gc2", name: "Royal DNA ×50", icon: UI.dna, price: 252000, rarity: "Cosmic", note: "+50 DNA", reward: { dna: 50 }, stock: 3 },
      { id: "gc3", name: "Treasure Hoard", icon: UI.coin, price: 147000, rarity: "Legendary", note: "+50 DNA + 5 eggs", reward: { dna: 50, eggs: 5 }, stock: 2 },
    ],
  },
];

const BLACK_MARKET: Item[] = [
  { id: "bm1", name: "Legendary Egg", img: "/egg-cosmic.png", price: 6700, was: 11200, rarity: "Legendary", reward: { eggs: 1 }, stock: 2 },
  { id: "bm2", name: "Cosmic DNA ×40", icon: UI.dna, price: 4900, was: 7700, rarity: "Cosmic", note: "+40 DNA", reward: { dna: 40 }, stock: 3 },
  { id: "bm3", name: "Forbidden Booster", icon: UI.orb, price: 4200, was: 7000, rarity: "Cosmic", note: "+60% Cosmic odds", stock: 1 },
];

// harbor progression unlocks
const UNLOCKS: { lvl: number; label: string; icon: string }[] = [
  { lvl: 3, label: "+1 Merchant slot", icon: UI.market },
  { lvl: 6, label: "Epic-tier offers", icon: UI.gemEpic },
  { lvl: 9, label: "+1 Flash Ship", icon: UI.ship },
  { lvl: 12, label: "Legendary offers", icon: UI.crown },
  { lvl: 16, label: "Black Market access", icon: UI.candle },
  { lvl: 20, label: "Cosmic offers", icon: UI.cosmic },
];

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const nextBoundary = (now: number, period: number) => Math.ceil((now + 1) / period) * period;

function fmtLong(ms: number) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
function fmtClock(ms: number) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

const harborLevel = (xp: number) => Math.min(20, Math.floor(xp / 320) + 1);

const FEED_NAMES = ["James", "Sarah", "Mike", "Nova", "Luna", "AxolMaster", "Kai", "Zara", "Pixel", "Reef", "Echo", "Mochi"];
const FEED_CLS: AxolClass[] = ["beast", "plant", "aquatic", "bird", "bug", "reptile", "crystal", "shadow", "mech", "ember", "void"];
type Feed = { id: number; who: string; verb: string; what: string; color: string; img: string; amt?: number };
let feedSeq = 1;
function randomFeed(): Feed {
  const who = FEED_NAMES[Math.floor(Math.random() * FEED_NAMES.length)];
  const cls = FEED_CLS[Math.floor(Math.random() * FEED_CLS.length)];
  const meta = CLASS_META[cls];
  const n = Math.floor(Math.random() * 40) + 1;
  const kind = Math.random();
  if (kind < 0.3) return { id: feedSeq++, who, verb: "sold", what: `${meta.name} #${n}`, color: meta.color, img: meta.sprite, amt: 840 + Math.floor(Math.random() * 18) * 210 };
  if (kind < 0.6) return { id: feedSeq++, who, verb: "bought", what: `${meta.name} #${n}`, color: meta.color, img: meta.sprite, amt: 840 + Math.floor(Math.random() * 18) * 210 };
  if (kind < 0.78) return { id: feedSeq++, who, verb: "hatched a Legendary", what: meta.name, color: "#ffb02e", img: meta.sprite };
  if (kind < 0.92) return { id: feedSeq++, who, verb: "rolled a Rare", what: meta.name, color: "#3db4ff", img: meta.sprite };
  return { id: feedSeq++, who, verb: "pulled a", what: "Cosmic Egg", color: "#c46bff", img: "/egg-cosmic.png" };
}

// ---------------------------------------------------------------------------
// screen
// ---------------------------------------------------------------------------

export default function MarketScreen({ world }: { world: WorldApi }) {
  const now = useNow(1000);
  const [harborTab, setHarborTab] = useState<"shop" | "players">("shop");
  const [openMerchant, setOpenMerchant] = useState<Merchant | null>(null);
  const [blackOpen, setBlackOpen] = useState(false);
  const [stock, setStock] = useState<Record<string, number>>(() => {
    const s: Record<string, number> = {};
    [...SPECIALS, ...MERCHANTS].forEach((m) => m.items.forEach((it) => it.stock != null && (s[it.id] = it.stock)));
    SHIPS.forEach((sh) => sh.items.forEach((it) => it.stock != null && (s[it.id] = it.stock)));
    BLACK_MARKET.forEach((it) => it.stock != null && (s[it.id] = it.stock));
    return s;
  });

  const [harborXp, setHarborXp] = useState(2080);
  useEffect(() => {
    const saved = Number(window.localStorage?.getItem("harbor_xp"));
    if (!Number.isNaN(saved) && saved > 0) setHarborXp(saved);
  }, []);
  const level = harborLevel(harborXp);
  const intoLevel = harborXp % 320;

  // rotating special merchant (6h buckets)
  const special = SPECIALS[Math.floor(now / (6 * HOUR)) % SPECIALS.length];
  const specialEnds = nextBoundary(now, 6 * HOUR);

  // black market: ~15% chance per 20-min window (deterministic)
  const bmWindow = Math.floor(now / (20 * 60_000));
  const bmActive = useMemo(() => {
    let h = (bmWindow * 2654435761) % 1000;
    if (h < 0) h += 1000;
    return h < 150; // ~15%
  }, [bmWindow]);
  const bmEnds = nextBoundary(now, 20 * 60_000);

  // animated market feed
  const [feed, setFeed] = useState<Feed[]>(() => Array.from({ length: 6 }, randomFeed));
  useEffect(() => {
    const t = setInterval(() => setFeed((f) => [randomFeed(), ...f].slice(0, 7)), 3800);
    return () => clearInterval(t);
  }, []);

  function grantXp(price: number) {
    setHarborXp((x) => {
      const nx = Math.min(20 * 320, x + Math.max(8, Math.round(price / 12)));
      window.localStorage?.setItem("harbor_xp", String(nx));
      return nx;
    });
  }

  const [confirmItem, setConfirmItem] = useState<Item | null>(null);
  const [buying, setBuying] = useState(false);

  function requestBuy(it: Item) {
    if (it.stock != null && (stock[it.id] ?? 0) <= 0) {
      world.toast("Sold out — check back soon!");
      return;
    }
    sfx.click();
    setConfirmItem(it);
  }

  async function executeBuy(it: Item): Promise<boolean> {
    if (it.stock != null && (stock[it.id] ?? 0) <= 0) {
      world.toast("Sold out — check back soon!");
      return false;
    }
    const reward: Partial<Resources> = { ...it.reward };
    if (reward.energy === 9999) reward.energy = world.resources.maxEnergy;
    try {
      const ok = await world.purchase(it.price, reward, it.name, it.id);
      if (!ok) return false;
      if (it.addAxol) world.addAxol(randomAxol({ rarity: it.addAxol }));
      if (it.stock != null) setStock((s) => ({ ...s, [it.id]: (s[it.id] ?? 0) - 1 }));
      sfx.coin();
      grantXp(it.price);
      world.toast(`Bought ${it.name}!`);
      return true;
    } catch {
      world.toast("Purchase failed — try again", { critical: true });
      return false;
    }
  }

  async function confirmPurchase() {
    if (!confirmItem || buying || world.purchasing) return;
    setBuying(true);
    try {
      const ok = await executeBuy(confirmItem);
      if (ok) setConfirmItem(null);
    } finally {
      setBuying(false);
    }
  }

  const dailyEnds = useMemo(() => {
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    return d.getTime();
  }, []);

  return (
    <ScreenShell bg="/harbor-page-bg.png" dark={0.78}>
      <ScreenTop world={world} title="HARBOR MARKET" subtitle="A living port of traders, ships & secrets" icon="/icon-market.png" />

      <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-3 px-3 pb-nav sm:px-5">
        <div className="col-span-12 flex gap-1 rounded-full border border-white/10 bg-black/35 p-1 lg:col-span-8">
          <button
            type="button"
            onClick={() => setHarborTab("shop")}
            className={`flex-1 rounded-full py-2 font-display text-[0.68rem] font-extrabold uppercase tracking-wide transition ${
              harborTab === "shop" ? "bg-gradient-to-r from-amber-400 to-amber-600 text-ink-900" : "text-white/55 hover:text-white/80"
            }`}
          >
            Harbor Shop
          </button>
          <button
            type="button"
            onClick={() => setHarborTab("players")}
            className={`flex-1 rounded-full py-2 font-display text-[0.68rem] font-extrabold uppercase tracking-wide transition ${
              harborTab === "players" ? "bg-gradient-to-r from-cyan-400 to-brand-500 text-white shadow-glow" : "text-white/55 hover:text-white/80"
            }`}
          >
            Player Market
          </button>
        </div>

        {harborTab === "players" ? (
          <div className="col-span-12 lg:col-span-8">
            <MarketplacePanel world={world} />
          </div>
        ) : (
        <>
        {/* MAIN */}
        <div className="col-span-12 space-y-4 lg:col-span-8">
          {/* header scene */}
          <div className="relative h-44 overflow-hidden rounded-3xl border border-white/12 shadow-panel sm:h-52">
            <img src="/harbor-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-transparent to-transparent" />
            <div
              className="absolute left-1/2 top-3 -translate-x-1/2 rounded-2xl border-2 px-5 py-1.5 text-center"
              style={{ background: "linear-gradient(180deg,#6b4326,#3e2614)", borderColor: "#caa15f", boxShadow: "0 8px 18px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.25)" }}
            >
              <span className="font-display text-base font-extrabold tracking-[0.18em] sm:text-lg" style={{ color: "#ffd98a", textShadow: "0 1px 0 rgba(0,0,0,0.6)" }}>
                ⚓ HARBOR MARKET
              </span>
            </div>
            <img src="/shopkeeper.png" alt="" className="absolute -bottom-1 left-2 z-10 h-40 w-auto animate-floaty object-contain drop-shadow-2xl sm:h-44" draggable={false} />
            <div className="absolute left-2 top-2 z-20 max-w-[min(calc(100%-5rem),12rem)] rounded-2xl rounded-bl-none border border-black/10 bg-white px-2.5 py-1.5 text-[0.62rem] font-bold leading-snug text-ink-900 shadow-[0_8px_22px_rgba(0,0,0,0.55)] sm:left-48 sm:top-24 sm:max-w-[210px] sm:px-3 sm:py-2 sm:text-[0.72rem]">
              Welcome back! The tide brought new traders today.
              <span className="absolute -bottom-1.5 left-4 h-3 w-3 rotate-45 border-b border-r border-black/10 bg-white" />
            </div>
          </div>

          {/* DAILY DEAL — Supercell hero */}
          <DailyDeal world={world} ends={dailyEnds - now} onBuy={requestBuy} busy={buying || world.purchasing} />

          {/* BLACK MARKET (rare) */}
          {bmActive ? <BlackMarketBanner endsIn={bmEnds - now} onEnter={() => setBlackOpen(true)} /> : null}

          {/* TRAVELING MERCHANTS */}
          <div>
            <div className="mb-2 flex items-end justify-between">
              <SectionTitle accent="#ffd24a"><span className="inline-flex items-center gap-2"><GameIcon src={UI.market} size={18} /> Traveling Merchants</span></SectionTitle>
              <span className="text-[0.62rem] text-white/45">Tap a stall to browse</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MERCHANTS.map((m) => (
                <MerchantBooth key={m.id} m={m} onClick={() => setOpenMerchant(m)} />
              ))}
            </div>
          </div>

          {/* FLASH SHIPS */}
          <div>
            <div className="mb-2 flex items-end justify-between">
              <SectionTitle accent="#2fe0cf">⛵ Flash Ships</SectionTitle>
              <span className="text-[0.62rem] text-white/45">Limited cargo — rotates on departure</span>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {SHIPS.map((sh) => (
                <ShipCard key={sh.id} sh={sh} endsIn={nextBoundary(now, sh.periodMs) - now} stock={stock} onBuy={requestBuy} />
              ))}
            </div>
          </div>
        </div>

        {/* ASIDE */}
        <aside className="col-span-12 space-y-3 lg:col-span-4">
          <HarborProgress level={level} into={intoLevel} />
          <SpecialMerchant m={special} endsIn={specialEnds - now} stock={stock} onVisit={() => setOpenMerchant(special)} />
          <MarketFeed feed={feed} />
        </aside>
        </>
        )}
      </div>

      {openMerchant ? <MerchantModal m={openMerchant} stock={stock} onBuy={requestBuy} onClose={() => setOpenMerchant(null)} /> : null}
      {blackOpen ? <BlackMarketModal endsIn={bmEnds - now} stock={stock} onBuy={requestBuy} onClose={() => setBlackOpen(false)} /> : null}
      {confirmItem ? (
        <PurchaseConfirmModal
          item={confirmItem}
          busy={buying || world.purchasing}
          onConfirm={() => void confirmPurchase()}
          onClose={() => setConfirmItem(null)}
        />
      ) : null}
    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------

function Coin({ lg }: { lg?: boolean }) {
  return <img src="/icons/coin.png" alt="" className={lg ? "h-5 w-5" : "h-3.5 w-3.5"} draggable={false} />;
}

function PriceTag({ price, was, compact }: { price: number; was?: number; compact?: boolean }) {
  if (compact) {
    return (
      <span className="flex flex-col items-center leading-tight">
        <span className="flex items-center gap-0.5 font-display text-[0.62rem] font-extrabold text-amber-300">
          <Coin /> {price.toLocaleString()}
        </span>
        {was ? <span className="text-[0.5rem] font-bold text-white/35 line-through">{was.toLocaleString()}</span> : null}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 font-display text-[0.82rem] font-extrabold text-amber-300">
      <Coin /> {price.toLocaleString()}
      {was ? <span className="ml-0.5 text-[0.62rem] font-bold text-white/35 line-through">{was.toLocaleString()}</span> : null}
    </span>
  );
}

function ShipItemTile({ it, sold, onBuy }: { it: Item; sold?: boolean; onBuy: () => void }) {
  const rc = RARITY_META[it.rarity].color;
  return (
    <div className="flex min-h-[148px] flex-col rounded-2xl border bg-gradient-to-b from-white/[0.05] to-black/40 p-2" style={{ borderColor: `${rc}44` }}>
      <div className="relative mx-auto grid h-14 w-full place-items-center shrink-0">
        <span className="absolute h-10 w-10 rounded-full blur-xl" style={{ background: `${rc}55` }} />
        {it.img ? (
          <img src={it.img} alt="" className="relative h-12 w-12 object-contain" draggable={false} style={{ filter: `drop-shadow(0 0 8px ${rc}bb)` }} />
        ) : it.icon ? (
          <GameIcon src={it.icon} size={32} glow={rc} className="relative" />
        ) : null}
      </div>
      <div className="mt-1 flex min-h-[2.1rem] flex-1 items-start justify-center px-0.5 text-center text-[0.58rem] font-extrabold leading-snug text-white [overflow-wrap:anywhere]">
        {it.name}
      </div>
      {it.note ? (
        <div className="min-h-[0.95rem] px-0.5 text-center text-[0.5rem] font-bold leading-snug text-emerald-300 [overflow-wrap:anywhere]">{it.note}</div>
      ) : (
        <div className="min-h-[0.95rem] text-[0.5rem] font-bold uppercase" style={{ color: rc }}>&nbsp;</div>
      )}
      {it.stock != null ? (
        <div className="text-center text-[0.48rem] font-bold text-amber-200/80">{sold ? "SOLD OUT" : `${it.stock} left`}</div>
      ) : null}
      <button
        onClick={onBuy}
        disabled={sold}
        className="mt-auto flex min-h-[2.4rem] items-center justify-center rounded-xl bg-ink-900/80 px-1 py-1.5 ring-1 ring-white/10 transition enabled:hover:bg-amber-400/15 disabled:opacity-40"
      >
        {sold ? <span className="text-[0.62rem] font-extrabold text-amber-300/60">Sold out</span> : <PriceTag price={it.price} was={it.was} compact />}
      </button>
    </div>
  );
}

/** Compact item tile used inside merchant/black-market panels. */
function ItemTile({ it, sold, onBuy }: { it: Item; sold?: boolean; onBuy: () => void }) {
  const rc = RARITY_META[it.rarity].color;
  return (
    <div className="flex flex-col rounded-2xl border bg-gradient-to-b from-white/[0.05] to-black/40 p-2" style={{ borderColor: `${rc}44` }}>
      <div className="relative grid h-16 place-items-center">
        <span className="absolute h-12 w-12 rounded-full blur-xl" style={{ background: `${rc}55` }} />
        {it.img ? (
          <img src={it.img} alt="" className="relative h-14 w-14 object-contain" draggable={false} style={{ filter: `drop-shadow(0 0 8px ${rc}bb)` }} />
        ) : it.icon ? (
          <GameIcon src={it.icon} size={36} glow={rc} className="relative" />
        ) : null}
      </div>
      <div className="mt-1 truncate text-center text-[0.66rem] font-extrabold text-white">{it.name}</div>
      {it.note ? <div className="truncate text-center text-[0.54rem] font-bold text-emerald-300">{it.note}</div> : <div className="text-[0.54rem] font-bold uppercase" style={{ color: rc }}>&nbsp;</div>}
      {it.stock != null ? <div className="text-center text-[0.5rem] font-bold text-amber-200/80">{sold ? "SOLD OUT" : `${it.stock} left`}</div> : null}
      <button
        onClick={onBuy}
        disabled={sold}
        className="mt-1 flex items-center justify-center gap-1 rounded-xl bg-ink-900/80 py-1.5 text-[0.7rem] font-extrabold text-amber-300 ring-1 ring-white/10 transition enabled:hover:bg-amber-400/15 disabled:opacity-40"
      >
        {sold ? "Sold out" : <PriceTag price={it.price} was={it.was} />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily Deal
// ---------------------------------------------------------------------------

function DailyDeal({
  world,
  ends,
  onBuy,
  busy,
}: {
  world: WorldApi;
  ends: number;
  onBuy: (it: Item) => void;
  busy?: boolean;
}) {
  const deal: Item = { id: "daily", name: "Mystery Egg", img: "/egg-cosmic.png", price: 9000, was: 15000, rarity: "Epic", reward: { eggs: 1 } };
  const canAfford = world.resources.solax >= deal.price;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 p-4 shadow-panel">
      <img src="/deal-bg.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" draggable={false} />
      <span className="pointer-events-none absolute inset-0 bg-ink-900/30" />
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sheen bg-white/10 blur-md" />
      <div className="relative z-10 flex items-center justify-between">
        <SectionTitle accent="#ffd24a">⭐ Daily Deal</SectionTitle>
        <span className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 font-display text-[0.72rem] font-extrabold text-amber-200 ring-1 ring-amber-300/30">⏱ {fmtClock(ends)}</span>
      </div>

      <div className="relative z-10 mt-2 flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative grid h-40 w-40 shrink-0 place-items-center">
          <span className="absolute h-36 w-36 animate-aura rounded-full bg-fuchsia-500/35 blur-2xl" />
          <span className="absolute bottom-2 left-1/2 h-4 w-24 -translate-x-1/2 rounded-full bg-black/50 blur-md" />
          <img src={deal.img} alt="" className="relative h-40 w-40 animate-floaty object-contain" draggable={false} style={{ filter: "drop-shadow(0 0 22px rgba(196,107,255,0.9))" }} />
          <span className="absolute -left-1 top-1 rotate-[-12deg] rounded-xl bg-rose-500 px-3 py-1 font-display text-sm font-extrabold text-white shadow-lg ring-2 ring-white/40">40% OFF</span>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="font-display text-2xl font-extrabold text-white">{deal.name}</div>
          <div className="text-[0.66rem] font-bold uppercase tracking-widest text-fuchsia-300">Epic · Limited Today</div>
          <p className="mt-1 text-[0.72rem] text-white/60">Could hatch anything up to Legendary. Today only at a steal.</p>
          <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
            <span className="flex items-center gap-1 font-display text-2xl font-extrabold text-amber-300">
              <Coin lg /> {deal.price.toLocaleString()}
            </span>
            <span className="text-base text-white/40 line-through">{deal.was?.toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={() => onBuy(deal)}
            disabled={busy}
            className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#ffcf4a] to-[#ff9d1f] py-2.5 font-display text-base font-extrabold text-[#5a2e00] shadow-[0_10px_24px_rgba(255,157,31,0.5)] transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:px-10"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-white/40 blur-md transition-transform duration-700 group-hover:translate-x-full" />
            {busy ? "Processing…" : canAfford ? "BUY NOW" : "Not enough SOLAX"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Merchant booth + modal
// ---------------------------------------------------------------------------

function MerchantBooth({ m, onClick }: { m: Merchant; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-black/45 p-2 pt-3 transition hover:-translate-y-1"
      style={{ boxShadow: `0 12px 28px rgba(0,0,0,0.45)` }}
    >
      <span className="pointer-events-none absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl" style={{ background: `${m.accent}33` }} />
      <div className="relative grid h-28 w-full place-items-center">
        <img src={m.img} alt="" className="h-28 w-auto object-contain transition duration-300 group-hover:scale-105" draggable={false} style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.5))" }} />
      </div>
      <div className="mt-1 font-display text-[0.82rem] font-extrabold text-white">{m.name}</div>
      <div className="text-[0.56rem] font-bold uppercase tracking-wide" style={{ color: m.accent }}>{m.title}</div>
      <span className="mt-1.5 w-full rounded-xl py-1 text-center text-[0.66rem] font-extrabold text-white transition" style={{ background: `${m.accent}26`, boxShadow: `inset 0 0 0 1px ${m.accent}55` }}>
        Visit Stall
      </span>
    </button>
  );
}

function PurchaseConfirmModal({
  item,
  busy,
  onConfirm,
  onClose,
}: {
  item: Item;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const rc = RARITY_META[item.rarity].color;
  return (
    <ModalShell accent={rc} onClose={busy ? () => {} : onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="relative grid h-28 w-28 place-items-center">
          <span className="absolute h-24 w-24 rounded-full blur-2xl" style={{ background: `${rc}55` }} />
          {item.img ? (
            <img src={item.img} alt="" className="relative h-24 w-24 object-contain" draggable={false} style={{ filter: `drop-shadow(0 0 14px ${rc}bb)` }} />
          ) : item.icon ? (
            <GameIcon src={item.icon} size={48} glow={rc} className="relative" />
          ) : null}
        </div>
        <div className="mt-3 font-display text-2xl font-extrabold text-white">{item.name}</div>
        {item.note ? <div className="mt-1 text-[0.72rem] font-bold text-emerald-300">{item.note}</div> : null}
        <div className="mt-3 flex items-center justify-center gap-2">
          <PriceTag price={item.price} was={item.was} />
        </div>
        <p className="mt-3 max-w-sm text-[0.72rem] leading-relaxed text-white/60">
          Confirm to burn <b className="text-amber-300">{item.price.toLocaleString()} SOLAX</b> from your wallet. Phantom will open to approve the transfer.
        </p>
        <div className="mt-5 flex w-full gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-2.5 font-display text-sm font-extrabold text-white/80 transition enabled:hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-2xl bg-gradient-to-b from-[#ffcf4a] to-[#ff9d1f] py-2.5 font-display text-sm font-extrabold text-[#5a2e00] shadow-glow transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? "Waiting for wallet…" : "Confirm purchase"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({ accent, children, onClose }: { accent: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/85 px-4 backdrop-blur-sm" onClick={onClose}>
        <div
          className="relative w-full max-w-lg animate-pop rounded-3xl border p-5 shadow-panel"
          style={{ borderColor: `${accent}55`, background: "linear-gradient(160deg,#1a1030,#120a26)", boxShadow: `0 0 60px ${accent}33, 0 24px 60px rgba(0,0,0,0.6)` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/70" aria-label="Close"><CloseIcon className="h-3.5 w-3.5" /></button>
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

function MerchantModal({ m, stock, onBuy, onClose }: { m: Merchant; stock: Record<string, number>; onBuy: (it: Item) => void | Promise<boolean>; onClose: () => void }) {
  return (
    <ModalShell accent={m.accent} onClose={onClose}>
      <div className="flex items-start gap-3">
        <img src={m.img} alt="" className="h-24 w-24 shrink-0 object-contain" draggable={false} style={{ filter: `drop-shadow(0 0 14px ${m.accent}aa)` }} />
        <div className="flex-1">
          <div className="font-display text-xl font-extrabold text-white">{m.name}</div>
          <div className="text-[0.6rem] font-bold uppercase tracking-widest" style={{ color: m.accent }}>{m.title}</div>
          <div className="mt-1 rounded-2xl rounded-tl-none bg-white/10 px-3 py-1.5 text-[0.72rem] italic text-white/80">“{m.greeting}”</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {m.items.map((it) => (
          <ItemTile key={it.id} it={it} sold={it.stock != null && (stock[it.id] ?? 0) <= 0} onBuy={() => onBuy(it)} />
        ))}
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Flash Ship
// ---------------------------------------------------------------------------

function ShipCard({ sh, endsIn, stock, onBuy }: { sh: Ship; endsIn: number; stock: Record<string, number>; onBuy: (it: Item) => void | Promise<boolean> }) {
  return (
    <div className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border p-3.5 shadow-panel sm:min-w-[220px]" style={{ borderColor: `${sh.accent}40`, background: "linear-gradient(170deg,#16213a 0%,#0d1322 100%)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 font-display text-sm font-extrabold text-white">
          <GameIcon src={sh.badgeIcon} size={18} glow={sh.accent} className="shrink-0" />
          <span className="truncate">{sh.name}</span>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-black/45 px-2 py-0.5 text-[0.58rem] font-extrabold" style={{ color: sh.accent }}>{fmtLong(endsIn)}</span>
      </div>
      <div className="relative my-2 grid h-24 place-items-center">
        <span className="absolute bottom-2 h-3 w-28 rounded-full bg-black/50 blur-md" />
        <img src={sh.img} alt="" className="max-h-24 w-full max-w-[180px] animate-bob object-contain" draggable={false} style={{ filter: `drop-shadow(0 0 16px ${sh.accent}88)` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sh.items.map((it) => (
          <ShipItemTile key={it.id} it={it} sold={it.stock != null && (stock[it.id] ?? 0) <= 0} onBuy={() => onBuy(it)} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Special rotating merchant (FOMO)
// ---------------------------------------------------------------------------

function SpecialMerchant({ m, endsIn, stock, onVisit }: { m: Merchant; endsIn: number; stock: Record<string, number>; onVisit: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/40 p-4 shadow-panel" style={{ background: "linear-gradient(160deg,#3a2a10,#1c1430)" }}>
      <span className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 animate-aura rounded-full" style={{ background: `radial-gradient(circle, ${m.accent}66, transparent 70%)` }} />
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[0.56rem] font-extrabold uppercase tracking-wide text-white">Limited Time</span>
        <span className="flex items-center gap-1 text-[0.62rem] font-extrabold text-amber-200">Leaves in {fmtLong(endsIn)}</span>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <img src={m.img} alt="" className="h-24 w-24 shrink-0 animate-floaty object-contain" draggable={false} style={{ filter: `drop-shadow(0 0 16px ${m.accent}cc)` }} />
        <div className="min-w-0">
          <div className="font-display text-lg font-extrabold text-white">{m.name}</div>
          <div className="text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: m.accent }}>{m.title}</div>
          <p className="mt-0.5 line-clamp-2 text-[0.66rem] text-white/60">{m.greeting}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[0.6rem] text-white/50">
        {m.items.slice(0, 3).map((it) => (
          <span key={it.id} className="rounded-full px-2 py-0.5 font-bold" style={{ background: `${RARITY_META[it.rarity].color}22`, color: RARITY_META[it.rarity].color }}>
            {it.name}
            {it.stock != null ? ` ·${stock[it.id] ?? 0}` : ""}
          </span>
        ))}
      </div>
      <button onClick={onVisit} className="mt-3 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-2 font-display font-extrabold text-[#5a2e00] shadow-glow transition hover:-translate-y-0.5">
        Visit before they sail!
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Black Market
// ---------------------------------------------------------------------------

function BlackMarketBanner({ endsIn, onEnter }: { endsIn: number; onEnter: () => void }) {
  return (
    <button
      onClick={onEnter}
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl border-2 p-4 text-left shadow-panel"
      style={{ borderColor: "#caa15f", background: "linear-gradient(110deg,#1a0a2e 0%,#2a0f45 50%,#160826 100%)", boxShadow: "0 0 50px rgba(168,85,247,0.4)" }}
    >
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-rayspin opacity-30" style={{ background: "repeating-conic-gradient(from 0deg,rgba(196,107,255,0.4) 0deg 5deg,transparent 5deg 18deg)", maskImage: "radial-gradient(circle,black 30%,transparent 70%)", WebkitMaskImage: "radial-gradient(circle,black 30%,transparent 70%)" }} />
      <img src="/merchant-shadow.png" alt="" className="relative h-24 w-24 shrink-0 animate-floaty object-contain sm:h-28 sm:w-28" draggable={false} style={{ filter: "drop-shadow(0 0 22px rgba(196,107,255,0.95))" }} />
      <div className="relative flex-1">
        <div className="flex items-center gap-2">
          <span className="animate-pulse rounded-full bg-fuchsia-600 px-2 py-0.5 text-[0.56rem] font-extrabold uppercase tracking-widest text-white">Black Market</span>
          <span className="text-[0.6rem] font-bold text-amber-200">Vanishes in {fmtLong(endsIn)}</span>
        </div>
        <div className="mt-1 font-display text-xl font-extrabold" style={{ background: "linear-gradient(90deg,#e9c46a,#c46bff)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          A shady trader appears…
        </div>
        <p className="text-[0.7rem] text-white/65">Legendary Eggs · Cosmic DNA · Forbidden Boosters. Prices you won&apos;t see twice.</p>
      </div>
      <span className="relative hidden shrink-0 rounded-2xl bg-gradient-to-r from-amber-400 to-fuchsia-500 px-5 py-2 font-display font-extrabold text-white shadow-glow transition group-hover:-translate-y-0.5 sm:block">ENTER →</span>
    </button>
  );
}

function BlackMarketModal({ endsIn, stock, onBuy, onClose }: { endsIn: number; stock: Record<string, number>; onBuy: (it: Item) => void | Promise<boolean>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink-900/90 px-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="relative w-full max-w-lg animate-pop overflow-hidden rounded-3xl border-2 p-5 shadow-panel"
        style={{ borderColor: "#caa15f", background: "linear-gradient(160deg,#1d0b33,#120726)", boxShadow: "0 0 70px rgba(168,85,247,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-rayspin opacity-25" style={{ background: "repeating-conic-gradient(from 0deg,rgba(233,196,106,0.5) 0deg 5deg,transparent 5deg 18deg)", maskImage: "radial-gradient(circle,black 30%,transparent 70%)", WebkitMaskImage: "radial-gradient(circle,black 30%,transparent 70%)" }} />
        <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/70" aria-label="Close"><CloseIcon className="h-3.5 w-3.5" /></button>
        <div className="relative flex items-center gap-3">
          <img src="/merchant-shadow.png" alt="" className="h-28 w-28 shrink-0 animate-floaty object-contain" draggable={false} style={{ filter: "drop-shadow(0 0 22px rgba(196,107,255,0.95))" }} />
          <div>
            <div className="font-display text-2xl font-extrabold" style={{ background: "linear-gradient(90deg,#e9c46a,#c46bff)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              The Black Market
            </div>
            <div className="text-[0.6rem] font-bold uppercase tracking-widest text-amber-200">Vanishes in {fmtLong(endsIn)}</div>
            <p className="mt-1 text-[0.72rem] italic text-white/70">“Keep your voice down. Everything here is... off the books.”</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {BLACK_MARKET.map((it) => (
            <ItemTile key={it.id} it={it} sold={(stock[it.id] ?? 0) <= 0} onBuy={() => onBuy(it)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Harbor progression
// ---------------------------------------------------------------------------

function HarborProgress({ level, into }: { level: number; into: number }) {
  const next = UNLOCKS.find((u) => u.lvl > level);
  const pct = Math.round((into / 320) * 100);
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <SectionTitle accent="#2fe0cf">Harbor Level</SectionTitle>
        <span className="text-[0.6rem] font-bold text-white/45">Lv {level} / 20</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-cyan-400 to-teal-600 font-display text-lg font-extrabold text-white shadow-glow ring-2 ring-white/20">{level}</div>
        <div className="flex-1">
          <div className="h-3 w-full overflow-hidden rounded-full bg-black/50">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${level >= 20 ? 100 : pct}%` }} />
          </div>
          <div className="mt-1 text-[0.58rem] text-white/50">
            {level >= 20 ? (
              <span className="inline-flex items-center gap-1">Harbor fully upgraded! <GameIcon src={UI.cosmic} size={12} /></span>
            ) : next ? (
              <>Next: <span className="inline-flex items-center gap-1 font-bold text-white/80"><GameIcon src={next.icon} size={12} /> {next.label}</span> at Lv {next.lvl}</>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {UNLOCKS.map((u) => {
          const on = level >= u.lvl;
          return (
            <span key={u.lvl} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.54rem] font-bold" style={{ background: on ? "rgba(45,224,207,0.18)" : "rgba(255,255,255,0.05)", color: on ? "#7ff0e2" : "rgba(255,255,255,0.35)" }}>
              {on ? <GameIcon src={u.icon} size={12} /> : <GameIcon src={UI.lock} size={12} className="opacity-60" />} {u.label}
            </span>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Market feed (animated)
// ---------------------------------------------------------------------------

function MarketFeed({ feed }: { feed: Feed[] }) {
  const topId = useRef<number>(feed[0]?.id);
  const isNew = feed[0]?.id !== topId.current;
  topId.current = feed[0]?.id;
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <SectionTitle accent="#c08bff">Market Feed</SectionTitle>
        <span className="flex items-center gap-1 text-[0.56rem] font-bold text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {feed.map((f, i) => (
          <div key={f.id} className={`flex items-center gap-2.5 overflow-hidden ${i === 0 && isNew ? "animate-feedin" : ""}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full" style={{ background: `${f.color}26`, boxShadow: `inset 0 0 0 1px ${f.color}44` }}>
              <img src={f.img} alt="" className="h-7 w-7 object-contain" draggable={false} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[0.74rem] font-extrabold text-white">
                {f.who} <span className="font-bold text-white/55">{f.verb}</span>
              </div>
              <div className="truncate text-[0.64rem] font-bold" style={{ color: f.color }}>{f.what}</div>
            </div>
            {f.amt ? (
              <div className="flex shrink-0 items-center gap-1 text-[0.72rem] font-extrabold text-amber-300">
                <Coin /> {f.amt.toLocaleString()}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}
