export type RainLevel = 0 | 1 | 2 | 3;

export const RAIN_THRESHOLDS_MM = { light: 100, moderate: 170, heavy: 300 } as const;

export const RAIN_LABELS = ['Dry', 'Light rain', 'Rainy season', 'Heavy rain / monsoon'] as const;

export function rainLevel(mm: number | null | undefined): RainLevel | null {
  if (mm === null || mm === undefined || Number.isNaN(mm)) return null;
  if (mm >= RAIN_THRESHOLDS_MM.heavy) return 3;
  if (mm >= RAIN_THRESHOLDS_MM.moderate) return 2;
  if (mm >= RAIN_THRESHOLDS_MM.light) return 1;
  return 0;
}

export function effectiveRainLevel(derived: RainLevel | null, override?: RainLevel | null): RainLevel | null {
  return override ?? derived;
}

export function isMarked(level: RainLevel | null): boolean {
  return level !== null && level >= 2;
}
