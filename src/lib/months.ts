export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

export function wrapMonth(m: number): number {
  return ((((m - 1) % 12) + 12) % 12) + 1;
}

// Inclusive span that may cross the year boundary, e.g. (11, 2) -> [11, 12, 1, 2].
export function monthSpan(start: number, end: number): number[] {
  const out: number[] = [];
  let m = wrapMonth(start);
  const last = wrapMonth(end);
  for (let i = 0; i < 12; i++) {
    out.push(m);
    if (m === last) break;
    m = wrapMonth(m + 1);
  }
  return out;
}
