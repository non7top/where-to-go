import type { AreaClimate, AreaProps } from '../data/types';
import { feltHigh } from './feel';
import { interpMonthly, monthOfDay } from './season';

export interface Pick {
  id: string;
  name: string;
  iata?: string;
  country: string;
  level: AreaProps['level'];
  felt: number;
  rainLevel: number;
  cost: number;
  score: number;
}

export const GREEN = { min: 17, max: 26, ideal: 21.5 } as const;
const RAIN_PENALTY = [0, 0, 0.2, 0.35] as const;

// 1 at the ideal felt temperature, falling to 0 at the edges of the green band; rain and the curator's
// comfort rating nudge it. Areas outside the green band are not picks.
export function scorePick(felt: number, rainLevel: number, comfort: number | null): number {
  if (felt < GREEN.min || felt > GREEN.max) return 0;
  const half = Math.max(GREEN.ideal - GREEN.min, GREEN.max - GREEN.ideal);
  const base = 1 - Math.abs(felt - GREEN.ideal) / (half + 1);
  const rain = RAIN_PENALTY[Math.min(3, Math.max(0, rainLevel))]!;
  const rating = comfort === null ? 0 : (comfort - 3) * 0.08;
  return Math.max(0.01, base - rain + rating);
}

export function rankGreen(
  areas: readonly AreaProps[],
  climate: Readonly<Record<string, AreaClimate>>,
  day: number,
  levels: readonly AreaProps['level'][],
): Pick[] {
  const month = monthOfDay(day) - 1;
  const picks: Pick[] = [];
  for (const a of areas) {
    if (!levels.includes(a.level)) continue;
    const c = climate[a.id];
    if (!c) continue;
    const hi = interpMonthly(c.hi, day);
    const felt = feltHigh(hi, c.wind ? interpMonthly(c.wind, day) : null);
    if (felt === null) continue;
    const rainLevel = c.rainLevel[month] ?? 0;
    const score = scorePick(felt, rainLevel, c.comfort?.[month] ?? null);
    if (score <= 0) continue;
    picks.push({ id: a.id, name: a.name, iata: a.iata, country: a.country, level: a.level, felt, rainLevel, cost: c.cost[month] ?? 2, score });
  }
  return picks.sort((x, y) => y.score - x.score || x.name.localeCompare(y.name));
}
