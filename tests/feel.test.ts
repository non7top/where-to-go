import { describe, expect, it } from 'vitest';
import { feltHigh } from '../src/lib/feel';
import { comfortColor } from '../src/lib/color';
import { DAYS_LIMIT, etaText, etaTo, monthsAhead } from '../src/lib/timeuntil';

describe('feltHigh', () => {
  it('leaves calm or missing wind alone', () => {
    expect(feltHigh(28, 2)).toBe(28);
    expect(feltHigh(28, null)).toBe(28);
    expect(feltHigh(null, 6)).toBeNull();
  });
  it('cools a warm windy day', () => {
    expect(feltHigh(28, 6.2)).toBeCloseTo(28 - 0.7 * 3.2, 5);
  });
  it('never drops a warm day below the comfortable floor and leaves cold days alone', () => {
    expect(feltHigh(24, 12)).toBe(22);
    expect(feltHigh(10, 12)).toBe(10);
  });
});

describe('comfort gradient up to 26', () => {
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  it('stays greenish at 26 and turns orange by 30', () => {
    const [r26, g26] = rgb(comfortColor(26));
    const [r30, g30] = rgb(comfortColor(30));
    expect(g26!).toBeGreaterThan(r26!);
    expect(r30!).toBeGreaterThan(g30!);
  });
});

describe('monthsAhead', () => {
  it('wraps the year', () => {
    expect(monthsAhead(10, 1)).toBe(3);
    expect(monthsAhead(10, 10)).toBe(0);
    expect(monthsAhead(10, 9)).toBe(11);
  });
});

describe('etaTo', () => {
  const today = new Date(2026, 9, 27);
  it('is now in the current month', () => {
    expect(etaTo(today, 10)).toEqual({ kind: 'now' });
  });
  it('counts days to the start of the month while within 45 days', () => {
    expect(etaTo(today, 11)).toEqual({ kind: 'days', n: 5 });
    expect(etaTo(today, 12)).toEqual({ kind: 'days', n: 35 });
  });
  it('switches to months beyond 45 days', () => {
    expect(etaTo(today, 1)).toEqual({ kind: 'months', n: 3 });
    expect(etaTo(today, 9)).toEqual({ kind: 'months', n: 11 });
  });
  it('keeps exactly 45 days as days', () => {
    expect(DAYS_LIMIT).toBe(45);
    expect(etaTo(new Date(2026, 10, 17), 1)).toEqual({ kind: 'days', n: 45 });
    expect(etaTo(new Date(2026, 10, 16), 1)).toEqual({ kind: 'months', n: 2 });
  });
});

describe('etaText', () => {
  it('formats each kind', () => {
    expect(etaText({ kind: 'now' })).toBe('This month');
    expect(etaText({ kind: 'days', n: 1 })).toBe('in 1 day');
    expect(etaText({ kind: 'days', n: 35 })).toBe('in 35 days');
    expect(etaText({ kind: 'months', n: 3 })).toBe('in 3 months');
  });
});
