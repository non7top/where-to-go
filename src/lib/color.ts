import type { AreaClimate } from '../data/types';
import { feltHigh } from './feel';
import { interpMonthly, YEAR_DAYS } from './season';

export type Stop = readonly [tempC: number, hex: string];

export const NO_DATA_COLOR = '#9aa0a6';

// Felt daytime-high comfort gradient: blue when cool, green about 17-26C, yellow then orange to 32C, red beyond.
export const COLOR_STOPS: readonly Stop[] = [
  [-5, '#27428f'],
  [5, '#3a6fd0'],
  [15, '#52a2e8'],
  [17.5, '#35ad6e'],
  [22.5, '#58b94a'],
  [26, '#86c240'],
  [28, '#c4d03c'],
  [30, '#f2b53a'],
  [32, '#ec7a2c'],
  [34, '#d42f2f'],
  [38, '#8c1c1c'],
];

function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(rgb: readonly number[]): string {
  return '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

export function comfortColor(tempC: number | null | undefined): string {
  if (tempC === null || tempC === undefined || Number.isNaN(tempC)) return NO_DATA_COLOR;
  const first = COLOR_STOPS[0]!;
  const last = COLOR_STOPS[COLOR_STOPS.length - 1]!;
  if (tempC <= first[0]) return first[1];
  if (tempC >= last[0]) return last[1];
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    const [t1, c1] = COLOR_STOPS[i]!;
    const [t0, c0] = COLOR_STOPS[i - 1]!;
    if (tempC <= t1) {
      const f = (tempC - t0) / (t1 - t0);
      const a = parseHex(c0);
      const b = parseHex(c1);
      return toHex(a.map((v, k) => v + (b[k]! - v) * f));
    }
  }
  return last[1];
}

export const BAND_STEP = 5;

// One color per 5-day step of the year for an area, from the felt daytime high; used to tint the time dial.
export function yearColors(c: AreaClimate | undefined): string[] {
  const out: string[] = [];
  for (let d = 0; d < YEAR_DAYS; d += BAND_STEP) {
    const day = d + BAND_STEP / 2;
    const hi = c ? interpMonthly(c.hi, day) : null;
    out.push(comfortColor(feltHigh(hi, c?.wind ? interpMonthly(c.wind, day) : null)));
  }
  return out;
}
