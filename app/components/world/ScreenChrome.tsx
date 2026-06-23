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

function ResChip({ icon, value, label, compact = false }: { icon: ReactNode; value: ReactNode; label: string; compact?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-ink-900/70 shadow-md backdrop-blur ${
        compact ? "py-0.5 pl-0.5 pr-2" : "gap-2 py-1 pl-1 pr-3"
      }`}
    >
      <span className={`grid place-items-center rounded-full bg-white/10 ${compact ? "h-6 w-6 text-sm" : "h-7 w-7 text-base"}`}>
        {icon}
      </span>
      <div className="leading-none">
        <div className={`font-display font-extrabold tabular-nums text-white ${compact ? "text-xs" : "text-[0.82rem]"}`}>
          {value}
        </div>
        <div className={`uppercase tracking-wide text-white/45 ${compact ? "text-[0.42rem]" : "text-[0.46rem]"}`}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function ResChips({ world, compact = false }: { world: WorldApi; compact?: boolean }) {
  const r = world.resources;
  const iconSize = compact ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex items-center gap-1.5">
      <ResChip compact={compact} icon={<img src="/icons/coin.png" alt="" className={`${iconSize} object-contain`} />} value={Math.round(r.solax).toLocaleString()} label="SOLAX" />
      <ResChip compact={compact} icon={<img src="/icons/dna.png" alt="" className={`${iconSize} object-contain`} />} value={r.dna} label="DNA" />
      <ResChip compact={compact} icon={<img src="/icons/egg.png" alt="" className={`${iconSize} object-contain`} />} value={r.eggs} label="Eggs" />
      <ResChip compact={compact} icon={<img src="/icon-energy.png" alt="" className={`${iconSize} object-contain`} />} value={`${r.energy}/${r.maxEnergy}`} label="Energy" />
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
    <header className="sticky top-0 z-30 bg-gradient-to-b from-ink-900/95 via-ink-900/85 to-ink-900/70 pt-[env(safe-area-inset-top,0px)]">
      <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3">
        <button
          onClick={() => world.setScreen("home")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-ink-850/80 text-lg text-white shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:border-white/40 sm:h-11 sm:w-11"
          aria-label="Back to pond"
        >
          ←
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {icon ? <img src={icon} alt="" className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_0_12px_rgba(168,99,255,0.45)] sm:h-10 sm:w-10" draggable={false} /> : null}
          <div className="min-w-0 leading-tight">
            <h1 className="truncate font-display text-lg font-extrabold tracking-wide text-white sm:text-xl">{title}</h1>
            {subtitle ? <p className="truncate text-[0.62rem] text-white/55 sm:text-[0.66rem]">{subtitle}</p> : null}
          </div>
        </div>
        <div className="shrink-0">
          <ProfileDropdown world={world} />
        </div>
      </div>

      {center ? <div className="hidden px-3 pb-1 md:block sm:px-5">{center}</div> : null}

      <div className="overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-5 sm:pb-3 [&::-webkit-scrollbar]:hidden">
        <ResChips world={world} compact />
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
