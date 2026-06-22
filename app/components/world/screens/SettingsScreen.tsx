import { useEffect, useState } from "react";
import { sfx } from "@/lib/sfx";
import { shortAddr } from "@/lib/save";
import type { WorldApi } from "../world";
import { Panel, ScreenShell, ScreenTop, SectionTitle } from "../ScreenChrome";

const NOTIF_KEY = "solaxie_notifications";

function readNotifPref(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(NOTIF_KEY) !== "0";
}

export default function SettingsScreen({ world }: { world: WorldApi }) {
  const [muted, setMuted] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    setMuted(sfx.isMuted());
    setNotifications(readNotifPref());
  }, []);

  const toggleMute = () => {
    const nowMuted = sfx.toggleMuted();
    setMuted(nowMuted);
    if (!nowMuted) sfx.startAmbient();
    sfx.click();
  };

  const toggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NOTIF_KEY, next ? "1" : "0");
    }
    world.toast(next ? "Notifications on" : "Notifications off");
    sfx.click();
  };

  const copyWallet = async () => {
    if (!world.walletAddress) return;
    try {
      await navigator.clipboard.writeText(world.walletAddress);
      world.toast("Address copied!");
    } catch {
      world.toast("Could not copy address");
    }
  };

  return (
    <ScreenShell bg="/empire-bg.png" dark={0.68}>
      <ScreenTop world={world} title="SETTINGS" subtitle="Audio, alerts, account · Solaxie v1.3" icon="/icon-energy.png" />

      <div className="mx-auto max-w-lg space-y-4 px-3 pb-28 sm:px-5">
        <Panel className="p-4">
          <SectionTitle accent="#54e07a">Audio</SectionTitle>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <div>
              <div className="text-sm font-extrabold text-white">Sound effects &amp; ambience</div>
              <p className="text-[0.65rem] text-white/50">Island music, battle sfx, spin reveals</p>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              className={`rounded-full px-4 py-2 font-display text-[0.72rem] font-extrabold transition ${
                muted ? "bg-white/10 text-white/60" : "bg-brand-500 text-white shadow-glow"
              }`}
            >
              {muted ? "Off" : "On"}
            </button>
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle accent="#ffd24a">Notifications</SectionTitle>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <div>
              <div className="text-sm font-extrabold text-white">In-game toasts</div>
              <p className="text-[0.65rem] text-white/50">Battle results, purchases, rewards</p>
            </div>
            <button
              type="button"
              onClick={toggleNotifications}
              className={`rounded-full px-4 py-2 font-display text-[0.72rem] font-extrabold transition ${
                notifications ? "bg-brand-500 text-white shadow-glow" : "bg-white/10 text-white/60"
              }`}
            >
              {notifications ? "On" : "Off"}
            </button>
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle accent="#3db4ff">Account</SectionTitle>
          <div className="mt-3 space-y-2">
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <div className="text-[0.62rem] font-bold uppercase tracking-wide text-white/45">Wallet</div>
              <div className="mt-1 font-mono text-sm font-bold text-white">
                {world.walletAddress ? shortAddr(world.walletAddress) : "Not connected"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyWallet}
                disabled={!world.walletAddress}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 font-display text-[0.72rem] font-extrabold text-white/80 transition hover:bg-white/10 disabled:opacity-40"
              >
                Copy address
              </button>
              <button
                type="button"
                onClick={() => {
                  void world.onDisconnect();
                  world.setScreen("home");
                }}
                className="flex-1 rounded-xl border border-rose-400/30 bg-rose-500/10 py-2.5 font-display text-[0.72rem] font-extrabold text-rose-200 transition hover:bg-rose-500/20"
              >
                Disconnect
              </button>
            </div>
          </div>
        </Panel>

        <p className="text-center text-[0.62rem] text-white/40">Solaxie v1.3 · solaxie.com</p>
      </div>
    </ScreenShell>
  );
}

/** When notifications are off, skip toast popups (still logs to console). */
export function notificationsEnabled(): boolean {
  return readNotifPref();
}
