import { CSSProperties } from "react";

export function GameIcon({
  src,
  size = 20,
  className = "",
  style,
  glow,
}: {
  src: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  glow?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      className={`inline-block object-contain ${className}`}
      style={{
        width: size,
        height: size,
        filter: glow ? `drop-shadow(0 0 6px ${glow})` : undefined,
        ...style,
      }}
      draggable={false}
    />
  );
}

export function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
