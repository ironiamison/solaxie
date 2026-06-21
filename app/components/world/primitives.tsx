import { ReactNode } from "react";
import { Axol, CLASS_META, RARITY_META, axolSprite } from "@/lib/game";
import { UI } from "@/lib/ui-icons";
import { CloseIcon, GameIcon } from "./GameIcon";

export function Modal({
  title,
  subtitle,
  iconSrc,
  onClose,
  children,
  maxW = "max-w-2xl",
}: {
  title: string;
  subtitle?: string;
  iconSrc?: string;
  onClose: () => void;
  children: ReactNode;
  maxW?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass-strong w-full ${maxW} max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-panel animate-pop`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold leading-none text-white">
              {iconSrc ? <GameIcon src={iconSrc} size={28} /> : null}
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stars({ rarity, size = "text-sm" }: { rarity: keyof typeof RARITY_META; size?: string }) {
  const meta = RARITY_META[rarity];
  return (
    <span className={`inline-flex ${size}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= meta.stars ? meta.color : "rgba(255,255,255,0.18)" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function RarityTag({ rarity }: { rarity: Axol["rarity"] }) {
  const meta = RARITY_META[rarity];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wide"
      style={{ background: meta.color, color: "#1a1030" }}
    >
      {rarity}
    </span>
  );
}

export function AxolArt({ axol, size = 120, float = true }: { axol: Axol; size?: number; float?: boolean }) {
  const color = CLASS_META[axol.cls].color;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full blur-xl"
        style={{ width: size * 0.8, height: size * 0.5, bottom: size * 0.06, background: `${color}55` }}
      />
      <img
        src={axolSprite(axol)}
        alt={CLASS_META[axol.cls].name}
        className={float ? "relative animate-floaty" : "relative"}
        style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.5))" }}
        draggable={false}
      />
    </div>
  );
}

export function StatRow({ axol }: { axol: Axol }) {
  const items: { k: string; v: number; c: string; icon: string }[] = [
    { k: "HP", v: axol.hp, c: "#ff6b6b", icon: UI.heart },
    { k: "ATK", v: axol.attack, c: "#ffb02e", icon: UI.sword },
    { k: "DEF", v: axol.defense, c: "#3db4ff", icon: UI.shield },
    { k: "SPD", v: axol.speed, c: "#54e07a", icon: UI.energy },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((it) => (
        <div key={it.k} className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-center">
          <GameIcon src={it.icon} size={18} className="mx-auto" glow={it.c} />
          <div className="font-display text-lg font-extrabold leading-none text-white">{it.v}</div>
          <div className="text-[0.5rem] font-bold tracking-wide" style={{ color: it.c }}>
            {it.k}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  variant = "purple",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "purple" | "pink" | "red" | "green";
  className?: string;
}) {
  const grad: Record<string, string> = {
    purple: "from-[#8a37ff] to-[#d63cff] shadow-[0_8px_24px_rgba(138,55,255,0.45)]",
    pink: "from-[#ff3d9a] to-[#ff7a3d] shadow-[0_8px_24px_rgba(255,61,154,0.4)]",
    red: "from-[#ff4d4d] to-[#ff2d7a] shadow-[0_8px_24px_rgba(255,77,77,0.4)]",
    green: "from-[#2fe0a0] to-[#2fa0e0] shadow-[0_8px_24px_rgba(47,224,160,0.4)]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${grad[variant]} px-5 py-2.5 font-display font-extrabold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}
