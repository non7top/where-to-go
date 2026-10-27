export const DAYS_LIMIT = 45;

export type Eta = { kind: 'now' } | { kind: 'days'; n: number } | { kind: 'months'; n: number };

// Forward distance in months from one month number to another, 0 to 11.
export function monthsAhead(from: number, to: number): number {
  return (((to - from) % 12) + 12) % 12;
}

// Time until the start of the next occurrence of `month`: days up to 45, then whole months.
export function etaTo(today: Date, month: number): Eta {
  const ahead = monthsAhead(today.getMonth() + 1, month);
  if (ahead === 0) return { kind: 'now' };
  const start = new Date(today.getFullYear(), today.getMonth() + ahead, 1);
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((start.getTime() - midnight.getTime()) / 86_400_000);
  return days <= DAYS_LIMIT ? { kind: 'days', n: days } : { kind: 'months', n: ahead };
}

export function etaText(eta: Eta): string {
  if (eta.kind === 'now') return 'This month';
  const unit = eta.kind === 'days' ? 'day' : 'month';
  return `in ${eta.n} ${unit}${eta.n === 1 ? '' : 's'}`;
}
