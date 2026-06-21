/** Pond position as % of the pond container (0–100). */
export type PondSpotPct = { left: number; top: number; scale?: number };

export type PondLayout = Record<string, PondSpotPct>;

export const HOME_DEFAULT_SPOTS: PondSpotPct[] = [
  { left: 42, top: 52 },
  { left: 57, top: 48 },
  { left: 48, top: 65 },
  { left: 63, top: 61 },
  { left: 35, top: 63 },
];

export const COLLECTION_DEFAULT_SPOTS: PondSpotPct[] = [
  { left: 26, top: 44, scale: 0.92 },
  { left: 50, top: 34, scale: 1.06 },
  { left: 74, top: 46, scale: 0.92 },
  { left: 38, top: 58, scale: 0.88 },
  { left: 62, top: 62, scale: 0.88 },
];

export function spotStyle(spot: PondSpotPct) {
  return { left: `${spot.left}%`, top: `${spot.top}%` };
}

export function spotForAxol(
  id: number,
  index: number,
  layout: PondLayout,
  defaults: PondSpotPct[],
): PondSpotPct {
  const saved = layout[String(id)];
  if (saved) return saved;
  return defaults[index % defaults.length];
}

export function clampSpot(left: number, top: number): PondSpotPct {
  return {
    left: Math.min(94, Math.max(6, Math.round(left * 10) / 10)),
    top: Math.min(88, Math.max(12, Math.round(top * 10) / 10)),
  };
}
