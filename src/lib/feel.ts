export const WIND = { calmMs: 3, coolPerMs: 0.7, floorC: 22 } as const;

// Wind cools a warm day, so a windy 28C can read as comfortable. Cold days are left alone, and the
// felt value never drops below the comfortable floor, so wind alone cannot turn a warm area blue.
export function feltHigh(hi: number | null, windMs: number | null | undefined): number | null {
  if (hi === null || windMs === null || windMs === undefined || Number.isNaN(windMs)) return hi;
  if (hi <= WIND.floorC) return hi;
  const cooling = WIND.coolPerMs * Math.max(0, windMs - WIND.calmMs);
  return Math.max(WIND.floorC, hi - cooling);
}
