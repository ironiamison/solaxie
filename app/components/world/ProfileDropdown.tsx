import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AvatarId } from "@/lib/profile";
import { PFP_AVATARS, avatarSrc } from "@/lib/profile";
import type { WorldApi } from "./world";

type View = "main" | "cosmetics";

function shortAddr(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/** Top-right trainer card popover — game identity first, wallet second. */
export function ProfileDropdown({ world }: { world: WorldApi }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("main");
  const [anchor, setAnchor] = useState({ top: 0, right: 16 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const p = world.profile;
  const connected = !!world.wallet;
  const displayName = connected ? (p.name.trim() || "Trainer") : "Guest";
  const pfp = avatarSrc(p.avatarId);
  const xpPct = Math.round((p.xp / p.xpToNext) * 100);

  const stats = useMemo(() => ({
    axols: world.axols.length,
    wins: world.quests.wins,
    highestGen: world.axols.length ? Math.max(...world.axols.map((a) => a.generation)) : 0,
    firstCosmic: world.axols.some((a) => a.rarity === "Cosmic") ? "Yes" : "No",
  }), [world.axols, world.quests.wins]);

  useEffect(() => {
    if (!open) { setView("main"); return; }
    const sync = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const copyWallet = async () => {
    if (!connected || !world.walletAddress) return;
    try {
      await navigator.clipboard.writeText(world.walletAddress);
      world.toast("Address copied!");
    } catch {
      world.toast("Could not copy address");
    }
  };

  const openExplorer = () => {
    if (!connected || !world.walletAddress) return;
    window.open(`https://solscan.io/account/${world.walletAddress}`, "_blank", "noopener,noreferrer");
  };

  const close = () => setOpen(false);

  const panel = open && typeof document !== "undefined" ? createPortal(
    <>
      {/* backdrop — click to close; keeps wallet buttons from fighting outside-click */}
      <button
        type="button"
        aria-label="Close profile"
        className="fixed inset-0 z-[199] bg-black/20"
        onClick={close}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Trainer profile"
        style={{ top: anchor.top, right: anchor.right }}
        className="fixed z-[200] w-[min(calc(100vw-16px),340px)] animate-riseup overflow-hidden rounded-3xl border border-brand-400/25 bg-ink-900/95 shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(168,99,255,0.18)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand-500/20 via-amber-400/5 to-transparent" />

        <div className="relative max-h-[min(78vh,640px)] overflow-y-auto overscroll-contain p-4">
          {view === "cosmetics" ? (
            <CosmeticsView
              current={p.avatarId}
              onPick={(id) => { world.setAvatarId(id); setView("main"); }}
              onBack={() => setView("main")}
            />
          ) : connected ? (
            <>
              {/* header */}
              <div className="flex flex-col items-center text-center">
                <span className="relative">
                  <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand-400/60 to-amber-300/40 blur-md" />
                  <span className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-white/20 bg-gradient-to-b from-brand-400/30 to-brand-700/40 shadow-glow">
                    <img src={pfp} alt="" className="h-full w-full scale-110 object-cover" draggable={false} />
                  </span>
                  <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink-900 bg-emerald-400" />
                </span>
                <h2 className="mt-3 font-display text-xl font-extrabold text-white">{displayName}</h2>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                  {p.league === "No Rank" ? (
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[0.66rem] font-extrabold text-white/50">
                      No Rank
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-0.5 text-[0.66rem] font-extrabold text-amber-200">
                      <img src="/rank-bronze.png" alt="" className="h-4 w-4 object-contain" />
                      {p.league}
                    </span>
                  )}
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[0.66rem] font-bold text-white/75">
                    {p.trophies.toLocaleString()} trophies
                  </span>
                  <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-2.5 py-0.5 text-[0.66rem] font-bold text-violet-200">
                    {(p.activityTickets ?? 0).toLocaleString()} tickets
                  </span>
                </div>
                <div className="mt-3 w-full">
                  <div className="mb-1 flex items-center justify-between text-[0.6rem] font-bold">
                    <span className="text-brand-200">Trainer Lv.{p.level}</span>
                    <span className="text-white/50">{p.xp} / {p.xpToNext} XP</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full border border-white/15 bg-black/50">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-300 to-amber-300" style={{ width: `${xpPct}%` }} />
                  </div>
                </div>
              </div>

              {/* quick actions */}
              <div className="mt-4 space-y-1">
                <ActionRow icon="/icon-empire.png" label="Empire Hall" onClick={() => { world.setScreen("empire"); close(); }} />
                <ActionRow icon="/icon-collection.png" label="Inventory" onClick={() => { world.setScreen("collection"); close(); }} />
                <ActionRow icon="/icon-arena.png" label="Battle History" onClick={() => { world.setScreen("empire"); close(); world.toast("Open Battle History tab in Empire Hall"); }} />
                <ActionRow icon="/avatar-axolotl.png" label="Cosmetics" onClick={() => setView("cosmetics")} />
                <ActionRow icon="/icon-energy.png" label="Settings" onClick={() => { world.setScreen("settings"); close(); }} />
              </div>

              {/* stats */}
              <div className="mt-4">
                <div className="mb-2 font-display text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-brand-200/80">Trainer Stats</div>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Tickets" value={(p.activityTickets ?? 0).toLocaleString()} accent="#a779ff" />
                  <StatCard label="Solaxies" value={String(stats.axols)} accent="#54e07a" />
                  <StatCard label="Wins" value={String(stats.wins)} accent="#ffd24a" />
                  <StatCard label="Highest Gen" value={String(stats.highestGen)} accent="#3db4ff" />
                  <StatCard label="First Cosmic" value={stats.firstCosmic} accent="#c08bff" />
                </div>
              </div>

              {/* wallet — secondary */}
              <div className="mt-4 rounded-2xl border border-white/8 bg-black/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-white/40">Wallet</span>
                  <span className={`rounded-full px-2 py-0.5 text-[0.56rem] font-bold ${connected ? "bg-emerald-400/15 text-emerald-300" : "bg-white/8 text-white/45"}`}>
                    {connected ? "Linked" : "Not linked"}
                  </span>
                </div>
                {connected ? (
                  <>
                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-ink-900/60 px-3 py-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-500/30 to-brand-700/20 text-[0.65rem]">◎</span>
                      <span className="flex-1 font-mono text-[0.78rem] font-bold text-white/80">{world.wallet ?? ""}</span>
                      <button type="button" onClick={copyWallet} className="rounded-lg bg-white/8 px-2 py-1 text-[0.62rem] font-extrabold text-white/70 transition hover:bg-white/15">Copy</button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={openExplorer} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-[0.68rem] font-extrabold text-white/70 transition hover:bg-white/10">Explorer</button>
                      <button
                        type="button"
                        onClick={() => { world.onDisconnect(); setOpen(false); }}
                        className="flex-1 rounded-xl border border-rose-400/25 bg-rose-500/10 py-2 text-[0.68rem] font-extrabold text-rose-300 transition hover:bg-rose-500/20"
                      >
                        Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => { world.onConnect(); setOpen(false); }}
                    className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 font-display text-[0.78rem] font-extrabold text-white shadow-glow transition hover:-translate-y-0.5"
                  >
                    Link Wallet
                  </button>
                )}
              </div>
            </>
          ) : (
            <LoggedOutView onConnect={() => { world.onConnect(); setOpen(false); }} />
          )}
        </div>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 shadow-md backdrop-blur transition hover:-translate-y-0.5 sm:pr-3 ${
          open ? "border-brand-400/50 bg-ink-900/90 shadow-glow" : "border-white/15 bg-ink-900/75 hover:border-white/30"
        }`}
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full ring-2 ring-brand-400/40 sm:h-10 sm:w-10">
          <img src={connected ? pfp : "/avatar-axolotl.png"} alt="" className="h-full w-full scale-110 object-cover" draggable={false} />
          <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-ink-900 ${connected ? "bg-emerald-400" : "bg-white/35"}`} />
        </span>
        <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="font-display text-[0.82rem] font-extrabold text-white">{displayName}</span>
            {connected ? (
              <span className="rounded-full bg-brand-500/25 px-1.5 py-px text-[0.58rem] font-extrabold text-brand-200">Lv.{p.level}</span>
            ) : (
              <span className="rounded-full bg-white/10 px-1.5 py-px text-[0.58rem] font-extrabold text-white/45">Tutorial</span>
            )}
          </span>
          <span className="text-[0.6rem] font-bold text-amber-200/90">{connected ? p.league : "Wallet not linked"}</span>
        </span>
        <span className="flex flex-col leading-tight sm:hidden">
          <span className="font-display text-[0.72rem] font-extrabold text-white">{connected ? `${displayName} · Lv.${p.level}` : "Guest · Tutorial"}</span>
          <span className="text-[0.54rem] font-bold text-amber-200/90">{connected ? p.league : "Link wallet"}</span>
        </span>
        <Chevron open={open} />
      </button>
      {panel}
    </div>
  );
}

function LoggedOutView({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <span className="relative">
        <span className="absolute -inset-1 rounded-full bg-white/10 blur-md" />
        <span className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-white/15 bg-black/40">
          <img src="/icons/icon-lock.png" alt="" className="h-10 w-10 object-contain opacity-80" draggable={false} />
        </span>
      </span>
      <h2 className="mt-3 font-display text-xl font-extrabold text-white">Not Signed In</h2>
      <p className="mt-2 max-w-[260px] text-[0.74rem] leading-relaxed text-white/55">
        Your Solana wallet is your trainer profile. Link it to access the island, collection, battles, and market.
      </p>
      <button
        type="button"
        onClick={onConnect}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 font-display text-[0.78rem] font-extrabold text-white shadow-glow transition hover:-translate-y-0.5"
      >
        Link Wallet
      </button>
      <p className="mt-3 text-[0.62rem] text-white/40">While logged out you can only browse the tutorial.</p>
    </div>
  );
}

function CosmeticsView({ current, onPick, onBack }: { current: AvatarId; onPick: (id: AvatarId) => void; onBack: () => void }) {
  const ids = Object.keys(PFP_AVATARS) as AvatarId[];
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={onBack} className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70">←</button>
        <div>
          <div className="font-display text-sm font-extrabold text-white">Choose Profile Icon</div>
          <div className="text-[0.58rem] text-white/50">Pick your trainer portrait</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {ids.map((id) => {
          const a = PFP_AVATARS[id];
          const active = id === current;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition ${
                active ? "border-brand-400 bg-brand-500/20 shadow-glow" : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <span
                className="grid h-16 w-16 place-items-center overflow-hidden rounded-full"
                style={{ boxShadow: active ? `0 0 16px ${a.ring}66` : undefined, outline: `2px solid ${a.ring}` }}
              >
                <img src={a.src} alt="" className="h-full w-full scale-110 object-cover" draggable={false} />
              </span>
              <span className="font-display text-[0.62rem] font-extrabold text-white">{a.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function ActionRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-left transition hover:border-brand-400/35 hover:bg-brand-500/10"
    >
      <span className="shrink-0">
        <img src={icon} alt="" className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(168,99,255,0.35)]" draggable={false} />
      </span>
      <span className="flex-1 font-display text-[0.82rem] font-extrabold text-white">{label}</span>
      <span className="text-sm text-white/30 transition group-hover:text-white/60">›</span>
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 shrink-0 text-white/45 transition ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
    </svg>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <div className="font-display text-lg font-extrabold leading-none text-white" style={{ textShadow: `0 0 14px ${accent}55` }}>{value}</div>
      <div className="mt-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}
