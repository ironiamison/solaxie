import { ReactNode } from "react";
import { ProfileDropdown } from "./ProfileDropdown";
import type { WorldApi } from "./world";

/** Glass card used across every screen. */
export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`glass rounded-3xl shadow-panel ${className}`}>{children}</div>;
}

export function SectionTitle({ children, accent = "#c08bff" }: { children: ReactNode; accent?: string }) {
  return (
    <div className="text-[0.66rem] font-extrabold uppercase tracking-[0.18em]" style={{ color: accent }}>
      {children}
    </div>
  );
}

function ResChip({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/12 bg-ink-900/70 py-1 pl-1 pr-3 shadow-md backdrop-blur">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-base">{icon}</span>
      <div className="leading-none">
        <div className="font-display text-[0.82rem] font-extrabold text-white">{value}</div>
        <div className="text-[0.46rem] uppercase tracking-wide text-white/45">{label}</div>
      </div>
    </div>
  );
}

export function ResChips({ world }: { world: WorldApi }) {
  const r = world.resources;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ResChip icon={<img src="/icons/coin.png" alt="" className="h-5 w-5 object-contain" />} value={Math.round(r.solax).toLocaleString()} label="SOLAX" />
      <ResChip icon={<img src="/icons/dna.png" alt="" className="h-5 w-5 object-contain" />} value={r.dna} label="DNA" />
      <ResChip icon={<img src="/icons/egg.png" alt="" className="h-5 w-5 object-contain" />} value={r.eggs} label="Eggs" />
      <ResChip icon={<img src="/icon-energy.png" alt="" className="h-5 w-5 object-contain" />} value={`${r.energy}/${r.maxEnergy}`} label="Energy" />
    </div>
  );
}

/** Top bar for non-home screens: back, title, optional center, resources, avatar. */
export function ScreenTop({
  world,
  title,
  subtitle,
  icon,
  center,
}: {
  world: WorldApi;
  title: string;
  subtitle?: string;
  icon?: string;
  center?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 bg-gradient-to-b from-ink-900/90 to-transparent px-3 py-3 sm:px-5">
      <button
        onClick={() => world.setScreen("home")}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 bg-ink-850/80 text-lg text-white shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:border-white/40"
        aria-label="Back to pond"
      >
        ←
      </button>
      <div className="flex items-center gap-2.5">
        {icon ? <img src={icon} alt="" className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_12px_rgba(168,99,255,0.45)]" draggable={false} /> : null}
        <div className="leading-tight">
          <h1 className="font-display text-xl font-extrabold tracking-wide text-white">{title}</h1>
          {subtitle ? <p className="text-[0.66rem] text-white/55">{subtitle}</p> : null}
        </div>
      </div>

      {center ? <div className="order-last w-full sm:order-none sm:w-auto sm:mx-2">{center}</div> : null}

      <div className="ml-auto flex items-center gap-2">
        <ResChips world={world} />
        <ProfileDropdown world={world} />
      </div>
    </header>
  );
}

export function ScreenShell({ bg, dark = 0.55, children }: { bg?: string; dark?: number; children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {bg ? (
        <div className="fixed inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: `url(${bg})` }} />
      ) : (
        <div
          className="fixed inset-0 -z-20"
          style={{
            background:
              "radial-gradient(120% 90% at 18% 0%, #241246 0%, #140a28 42%, #0a0612 100%), radial-gradient(80% 70% at 100% 100%, rgba(45,224,207,0.10), transparent 60%)",
          }}
        />
      )}
      <div className="fixed inset-0 -z-10" style={{ background: `linear-gradient(to bottom, rgba(8,5,18,${dark * 0.6}), rgba(8,5,18,${dark}) 60%, rgba(8,5,18,${Math.min(0.96, dark + 0.3)}))` }} />
      {children}
    </div>
  );
}
