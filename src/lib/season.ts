import type { Weekday } from '../data/types';

export const YEAR_DAYS = 365;
export const HALF_WINDOW = 7;

const MONTH_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Day index 0..364 of the first day of each month, in a 365-day year (Feb 29 is folded into Feb 28).
export const MONTH_START = MONTH_LEN.map((_, i) => MONTH_LEN.slice(0, i).reduce((a, b) => a + b, 0));
export const MID_DAY = MONTH_START.map((s, i) => s + (MONTH_LEN[i]! - 1) / 2);

export function wrapDay(day: number): number {
  return ((day % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS;
}

export function dayOfYear(date: Date): number {
  const m = date.getMonth();
  return MONTH_START[m]! + Math.min(date.getDate() - 1, MONTH_LEN[m]! - 1);
}

// "03-29" -> day index. Throws on a malformed value so bad data fails loudly.
export function dayFromMonthDay(md: string): number {
  const match = /^(\d{2})-(\d{2})$/.exec(md);
  const m = match ? Number(match[1]) : 0;
  const d = match ? Number(match[2]) : 0;
  if (m < 1 || m > 12 || d < 1 || d > MONTH_LEN[m - 1]!) throw new Error(`bad date "${md}", expected MM-DD`);
  return MONTH_START[m - 1]! + d - 1;
}

export function monthOfDay(day: number): number {
  const d = Math.floor(wrapDay(Math.round(day)));
  let m = 11;
  while (MONTH_START[m]! > d) m--;
  return m + 1;
}

export function circDist(a: number, b: number): number {
  const d = Math.abs(wrapDay(a) - wrapDay(b));
  return Math.min(d, YEAR_DAYS - d);
}

// Monthly values sit at mid-month; between them the value moves linearly, wrapping December to January.
export function interpMonthly(values: readonly (number | null)[], day: number): number | null {
  const d = wrapDay(day);
  const dd = d < MID_DAY[0]! ? d + YEAR_DAYS : d;
  for (let k = 0; k < 12; k++) {
    const a = MID_DAY[k]!;
    const b = MID_DAY[(k + 1) % 12]! + (k === 11 ? YEAR_DAYS : 0);
    if (dd < a || dd >= b) continue;
    const va = values[k] ?? null;
    const vb = values[(k + 1) % 12] ?? null;
    if (va === null) return vb;
    if (vb === null) return va;
    return va + (vb - va) * ((dd - a) / (b - a));
  }
  return null;
}

// An event with a peak and a spread is active when the selected 15-day section reaches its window.
export function isActive(peakDay: number, spread: number, centerDay: number): boolean {
  return circDist(peakDay, centerDay) <= spread + HALF_WINDOW;
}

function formatDay(day: number): { d: number; mon: string } {
  const w = Math.floor(wrapDay(Math.round(day)));
  let m = 11;
  while (MONTH_START[m]! > w) m--;
  return { d: w - MONTH_START[m]! + 1, mon: MONTH_ABBR[m]! };
}

export function dayLabel(day: number): string {
  const { d, mon } = formatDay(day);
  return `${d} ${mon}`;
}

export function sectionLabel(centerDay: number): string {
  const c = Math.round(centerDay);
  const a = formatDay(c - HALF_WINDOW);
  const b = formatDay(c + HALF_WINDOW);
  return a.mon === b.mon ? `${a.d}-${b.d} ${a.mon}` : `${a.d} ${a.mon} - ${b.d} ${b.mon}`;
}

export interface SeasonSpan {
  name: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  start: number;
  len: number;
}

const lenOf = (from: number, count: number) => MONTH_LEN.slice(from, from + count).reduce((a, b) => a + b, 0);

// Northern-hemisphere meteorological seasons, which fit East and Southeast Asia north of the equator.
export const SEASONS: readonly SeasonSpan[] = [
  { name: 'Spring', start: MONTH_START[2]!, len: lenOf(2, 3) },
  { name: 'Summer', start: MONTH_START[5]!, len: lenOf(5, 3) },
  { name: 'Autumn', start: MONTH_START[8]!, len: lenOf(8, 3) },
  { name: 'Winter', start: MONTH_START[11]!, len: lenOf(11, 1) + lenOf(0, 2) },
];

export function seasonOf(day: number): SeasonSpan {
  const d = wrapDay(Math.round(day));
  return SEASONS.find((s) => wrapDay(d - s.start) < s.len)!;
}

const WEEKDAYS: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// The nth (1 for first, -1 for last) given weekday of a month, e.g. the first Saturday of November.
export function nthWeekday(year: number, month: number, nth: number, weekday: Weekday): Date {
  if (nth < 0) {
    const last = new Date(year, month, 0);
    const back = (last.getDay() - WEEKDAYS.indexOf(weekday) + 7) % 7;
    return new Date(year, month - 1, last.getDate() - back + (nth + 1) * 7);
  }
  const shift = (WEEKDAYS.indexOf(weekday) - new Date(year, month - 1, 1).getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + shift + (nth - 1) * 7);
}

export function dateLabel(start: Date, length = 1): string {
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + length - 1);
  const day = length > 1 ? `${start.getDate()}${end.getMonth() === start.getMonth() ? '' : ` ${MONTH_ABBR[start.getMonth()]}`}-${end.getDate()}` : String(start.getDate());
  return `${day} ${MONTH_ABBR[end.getMonth()]} ${end.getFullYear()}`;
}
