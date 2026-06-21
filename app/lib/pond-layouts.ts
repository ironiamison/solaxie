import type { PondLayout, PondSpotPct } from "./pond-layout";

/** Per-view pond positions — home island vs collection preview use separate containers. */
export type PondLayouts = {
  home: PondLayout;
  collection: PondLayout;
};

export const EMPTY_POND_LAYOUTS: PondLayouts = { home: {}, collection: {} };

/** Migrate legacy flat layout saves. */
export function normalizePondLayouts(raw?: PondLayout | PondLayouts): PondLayouts {
  if (!raw) return { home: {}, collection: {} };
  if ("home" in raw && "collection" in raw) {
    const layouts = raw as PondLayouts;
    return { home: layouts.home ?? {}, collection: layouts.collection ?? {} };
  }
  return { home: { ...(raw as PondLayout) }, collection: {} };
}

export function layoutForView(layouts: PondLayouts, view: keyof PondLayouts): PondLayout {
  return layouts[view] ?? {};
}

export function setLayoutSpot(
  layouts: PondLayouts,
  view: keyof PondLayouts,
  axolId: number,
  spot: PondSpotPct,
): PondLayouts {
  return {
    ...layouts,
    [view]: { ...layouts[view], [String(axolId)]: spot },
  };
}

export function resetLayoutView(layouts: PondLayouts, view: keyof PondLayouts): PondLayouts {
  return { ...layouts, [view]: {} };
}
