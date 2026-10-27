import { describe, expect, it } from 'vitest';
import { comfortColor, NO_DATA_COLOR } from '../src/lib/color';
import { effectiveRainLevel, isMarked, rainLevel } from '../src/lib/rain';
import { monthSpan, wrapMonth } from '../src/lib/months';
import { eventsForMonth } from '../src/lib/events';
import { nightFlag } from '../src/lib/comfort';
import type { MapEvent } from '../src/data/types';

describe('comfortColor', () => {
  it('is green across the comfortable band', () => {
    expect(comfortColor(17.5)).toBe('#35ad6e');
    expect(comfortColor(20)).not.toBe(NO_DATA_COLOR);
  });
  it('clamps at the ends', () => {
    expect(comfortColor(-40)).toBe(comfortColor(-5));
    expect(comfortColor(60)).toBe(comfortColor(38));
  });
  it('is neutral without data', () => {
    expect(comfortColor(null)).toBe(NO_DATA_COLOR);
    expect(comfortColor(Number.NaN)).toBe(NO_DATA_COLOR);
  });
  it('blends between stops', () => {
    expect(comfortColor(28)).not.toBe(comfortColor(26));
    expect(comfortColor(28)).not.toBe(comfortColor(30));
  });
});

describe('rain', () => {
  it('maps rainfall to levels', () => {
    expect(rainLevel(50)).toBe(0);
    expect(rainLevel(100)).toBe(1);
    expect(rainLevel(170)).toBe(2);
    expect(rainLevel(300)).toBe(3);
    expect(rainLevel(null)).toBeNull();
  });
  it('marks only moderate and heavy', () => {
    expect([0, 1, 2, 3].map((l) => isMarked(l as 0 | 1 | 2 | 3))).toEqual([false, false, true, true]);
  });
  it('lets an override win, including a 0 override', () => {
    expect(effectiveRainLevel(3, 0)).toBe(0);
    expect(effectiveRainLevel(2, undefined)).toBe(2);
  });
});

describe('months', () => {
  it('wraps', () => {
    expect(wrapMonth(0)).toBe(12);
    expect(wrapMonth(13)).toBe(1);
    expect(wrapMonth(-11)).toBe(1);
  });
  it('spans the year boundary', () => {
    expect(monthSpan(11, 2)).toEqual([11, 12, 1, 2]);
    expect(monthSpan(5, 5)).toEqual([5]);
  });
});

describe('eventsForMonth', () => {
  const base = { category: 'festival', lon: 0, lat: 0, when: '', summary: '' } as const;
  const events: MapEvent[] = [
    { ...base, id: 'a', name: 'A', months: [12, 1] },
    { ...base, id: 'b', name: 'B', months: [6] },
  ];
  it('includes events that cross the boundary in both months', () => {
    expect(eventsForMonth(events, 12).map((e) => e.id)).toEqual(['a']);
    expect(eventsForMonth(events, 1).map((e) => e.id)).toEqual(['a']);
    expect(eventsForMonth(events, 6).map((e) => e.id)).toEqual(['b']);
    expect(eventsForMonth(events, 3)).toEqual([]);
  });
});

describe('nightFlag', () => {
  it('flags cold nights only where heating is missing', () => {
    expect(nightFlag(2, 'no')).toBe('cold');
    expect(nightFlag(2, 'yes')).toBeNull();
    expect(nightFlag(2, undefined)).toBeNull();
    expect(nightFlag(5, 'partial')).toBeNull();
    expect(nightFlag(2, 'partial')).toBe('cold');
  });
  it('flags hot nights only where cooling is missing', () => {
    expect(nightFlag(27, 'yes', 'no')).toBe('hot');
    expect(nightFlag(27, 'yes', 'yes')).toBeNull();
  });
  it('handles missing data', () => {
    expect(nightFlag(null, 'no', 'no')).toBeNull();
  });
});
