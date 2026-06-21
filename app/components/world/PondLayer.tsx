import { useRef } from "react";
import { Axol, CLASS_META, axolSprite } from "@/lib/game";
import {
  COLLECTION_DEFAULT_SPOTS,
  HOME_DEFAULT_SPOTS,
  PondLayout,
  PondSpotPct,
  clampSpot,
  spotForAxol,
  spotStyle,
} from "@/lib/pond-layout";

type Variant = "home" | "collection";

export function PondLayer({
  axols,
  layout,
  arranging,
  variant,
  selectedId,
  onPick,
  onSpotChange,
}: {
  axols: Axol[];
  layout: PondLayout;
  arranging: boolean;
  variant: Variant;
  selectedId?: number | null;
  onPick?: (a: Axol) => void;
  onSpotChange: (axolId: number, spot: PondSpotPct) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaults = variant === "home" ? HOME_DEFAULT_SPOTS : COLLECTION_DEFAULT_SPOTS;

  return (
    <div ref={containerRef} className="absolute inset-0">
      {arranging && (
        <div className="pointer-events-none absolute inset-0 z-[15]">
          <div className="absolute inset-[10%_8%] rounded-[42%] border-2 border-dashed border-cyan-300/35 bg-cyan-400/5" />
        </div>
      )}
      {axols.map((a, i) => {
        const spot = spotForAxol(a.id, i, layout, defaults);
        return (
          <PondCreature
            key={a.id}
            axol={a}
            spot={spot}
            variant={variant}
            selected={selectedId === a.id}
            arranging={arranging}
            delay={i * 0.4}
            containerRef={containerRef}
            onPick={onPick ? () => onPick(a) : undefined}
            onSpotChange={(next) => onSpotChange(a.id, { ...spot, ...next })}
          />
        );
      })}
    </div>
  );
}

function PondCreature({
  axol,
  spot,
  variant,
  selected,
  arranging,
  delay,
  containerRef,
  onPick,
  onSpotChange,
}: {
  axol: Axol;
  spot: PondSpotPct;
  variant: Variant;
  selected: boolean;
  arranging: boolean;
  delay: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onPick?: () => void;
  onSpotChange: (next: PondSpotPct) => void;
}) {
  const color = CLASS_META[axol.cls].color;
  const dragging = useRef(false);
  const baseSize = variant === "home" ? 84 : 88;
  const size = Math.round(baseSize * (spot.scale ?? 1));

  const onPointerDown = (e: React.PointerEvent) => {
    if (!arranging) {
      onPick?.();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const root = containerRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    onSpotChange(
      clampSpot(
        ((e.clientX - rect.left) / rect.width) * 100,
        ((e.clientY - rect.top) / rect.height) * 100,
      ),
    );
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const pos = spotStyle(spot);
  const Tag = arranging ? "div" : "button";
  const showLabel = arranging || variant === "collection";

  return (
    <Tag
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={arranging ? undefined : onPick}
      className={`group absolute touch-none ${arranging ? "cursor-grab active:cursor-grabbing" : ""} ${
        selected && !arranging ? "z-20" : "z-10"
      }`}
      style={{
        ...pos,
        transform: "translate(-50%, -50%)",
        ...(arranging ? { zIndex: dragging.current ? 40 : 30 } : {}),
      }}
    >
      {/* Anchor box — left/top is the sprite center, NOT label+sprite stack */}
      <div className="relative" style={{ width: size, height: size }}>
        {showLabel && (
          <div
            className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max max-w-[8rem] -translate-x-1/2 rounded-md border px-2 py-0.5 text-center backdrop-blur ${
              arranging
                ? "border-cyan-300/50 bg-ink-900/90"
                : selected
                  ? "border-emerald-300/70 bg-ink-900/90 shadow-glow"
                  : "border-white/12 bg-ink-900/80"
            } ${!arranging && variant === "home" ? "opacity-0 transition group-hover:opacity-100" : ""}`}
          >
            <div className="truncate text-[0.62rem] font-extrabold leading-tight text-white">
              {CLASS_META[axol.cls].name} #{axol.id}
            </div>
            {arranging ? (
              <div className="text-[0.5rem] font-semibold text-cyan-200/80">Lv.{axol.level}</div>
            ) : (
              variant === "collection" && (
                <>
                  <div className="text-[0.5rem] font-semibold text-cyan-200/80">Lv.{axol.level}</div>
                  <div className="truncate text-[0.48rem] text-white/50">{axol.status}</div>
                </>
              )
            )}
            {variant === "home" && !arranging && (
              <div className="truncate text-[0.48rem] text-white/50">{axol.status}</div>
            )}
          </div>
        )}

        {!arranging && (
          <>
            <span
              className="pointer-events-none absolute bottom-1 left-1/2 h-3 w-2/3 -translate-x-1/2 animate-ripple rounded-[50%] border border-cyan-100/50"
              style={{ animationDelay: `${delay}s` }}
            />
            <span
              className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-lg"
              style={{ width: size * 0.55, height: size * 0.28, background: `${color}55` }}
            />
          </>
        )}
        {arranging && (
          <span
            className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border-2 border-dashed border-cyan-300/50"
            style={{ width: size * 0.72, height: size * 0.24 }}
          />
        )}
        <div className={arranging ? "" : "animate-bob"} style={{ animationDelay: `${delay}s` }}>
          <img
            src={axolSprite(axol)}
            alt=""
            className={`mx-auto object-contain transition ${arranging ? "scale-105" : "group-hover:scale-105"}`}
            style={{
              width: size,
              height: size,
              filter: arranging
                ? `drop-shadow(0 0 14px ${color}88) drop-shadow(0 6px 8px rgba(0,0,0,0.5))`
                : `drop-shadow(0 7px 6px rgba(0,0,0,0.45)) drop-shadow(0 0 12px ${color}55)`,
            }}
            draggable={false}
          />
        </div>
      </div>
    </Tag>
  );
}

export function PondArrangeControls({
  arranging,
  onToggle,
  className = "",
  labeled = false,
}: {
  arranging: boolean;
  onToggle: () => void;
  className?: string;
  labeled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`grid place-items-center rounded-full border backdrop-blur transition ${
        arranging
          ? "border-emerald-400/60 bg-emerald-500/25 px-3 py-1.5 text-[0.62rem] font-extrabold uppercase text-emerald-100"
          : labeled
            ? "border-white/15 bg-ink-900/70 px-3 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-wide text-white/80 hover:bg-white/15"
            : "h-7 w-7 border-white/15 bg-ink-900/70 text-[0.7rem] text-white/70 hover:bg-white/15"
      } ${className}`}
      title={arranging ? "Finish arranging" : "Arrange your pond"}
    >
      {arranging ? "Done" : labeled ? "Arrange" : "✎"}
    </button>
  );
}
