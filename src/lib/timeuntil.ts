import { circDist, dayOfYear, HALF_WINDOW, wrapDay } from './season';

export const DAYS_LIMIT = 45;
const DAYS_PER_MONTH = 30.4;

export type Eta = { kind: 'now' } | { kind: 'days'; n: number } | { kind: 'months'; n: number };

// Time until the selected 15-day section starts: days up to 45, then whole months.
export function etaToDay(today: Date, centerDay: number): Eta {
  const t = dayOfYear(today);
  if (circDist(t, centerDay) <= HALF_WINDOW) return { kind: 'now' };
  const untilStart = Math.round(wrapDay(centerDay - t) - HALF_WINDOW);
  return untilStart <= DAYS_LIMIT
    ? { kind: 'days', n: untilStart }
    : { kind: 'months', n: Math.max(1, Math.round(untilStart / DAYS_PER_MONTH)) };
}

export function etaText(eta: Eta): string {
  if (eta.kind === 'now') return 'Now';
  const unit = eta.kind === 'days' ? 'day' : 'month';
  return `in ${eta.n} ${unit}${eta.n === 1 ? '' : 's'}`;
}
