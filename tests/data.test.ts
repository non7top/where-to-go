import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildOccurrences, peakWindows } from '../src/lib/events';
import { dayFromMonthDay } from '../src/lib/season';
import type { AreaProps, MapEvent } from '../src/data/types';

const read = <T>(f: string): T => JSON.parse(readFileSync(`public/data/${f}`, 'utf8')) as T;
const areas = read<{ features: { properties: AreaProps }[] }>('areas.geojson').features.map((f) => f.properties);
const fronts = read<MapEvent[]>('fronts.json');
const events = read<MapEvent[]>('events.json');
const { occurrences } = buildOccurrences(fronts, areas);

const peakOf = (eventId: string, areaName: string, country: string) => {
  const area = areas.find((a) => a.level === 'province' && a.country === country && a.name === areaName);
  return occurrences.find((o) => o.eventId === eventId && o.areaId === area?.id);
};

describe('season fronts in the shipped data', () => {
  it('runs the Shanghai ginkgo season from mid November to mid December, peaking in the second half of November', () => {
    const o = peakOf('ginkgo', 'Shanghai', 'CN')!;
    expect(o.day).toBeGreaterThanOrEqual(dayFromMonthDay('11-16'));
    expect(o.day).toBeLessThanOrEqual(dayFromMonthDay('11-30'));
    expect(o.day - o.spread).toBeLessThanOrEqual(dayFromMonthDay('11-15'));
    expect(o.day + o.spread).toBeGreaterThanOrEqual(dayFromMonthDay('12-10'));
  });
  it('marks the Shanghai ginkgo spots as zoom-in stars', () => {
    const { stars } = buildOccurrences(fronts, areas);
    const spots = stars.filter((s) => s.eventId === 'ginkgo' && s.detail);
    expect(spots).toHaveLength(6);
    for (const s of spots) {
      expect(s.lon).toBeGreaterThan(121);
      expect(s.lon).toBeLessThan(122);
      expect(s.lat).toBeGreaterThan(30.9);
      expect(s.lat).toBeLessThan(31.5);
    }
  });
  it('lets neighbouring Chinese areas follow latitude, later than Shanghai', () => {
    expect(peakOf('ginkgo', 'Zhejiang', 'CN')!.day).toBeGreaterThan(dayFromMonthDay('11-15'));
  });
  it('gives every front country its own name first and keeps the Japanese terms out of Korea and China labels', () => {
    for (const e of fronts) {
      for (const f of e.fronts ?? []) {
        expect(f.label, `${e.id} ${f.country}`).toBeTruthy();
        if (f.country !== 'JP') expect(f.label!.toLowerCase()).not.toMatch(/momiji|hanami/);
      }
    }
  });
});

describe('fixed events in the shipped data', () => {
  it('has the Dream Yosacoy Festival on the first weekend of November, in Tokyo', () => {
    const e = events.find((x) => x.id === 'dream-yosacoy')!;
    expect(e.name).toBe('Dream Yosacoy Festival');
    // Worked out by rule, so it moves with the calendar: 7-8 Nov 2026, then 6-7 Nov 2027.
    expect(e.peaks).toEqual([{ rule: { month: 11, nth: 1, weekday: 'sat' }, length: 2, spread: 1 }]);
    expect(peakWindows(e, new Date(2026, 9, 27))[0]!.dateLabel).toBe('7-8 Nov 2026');
    expect(peakWindows(e, new Date(2026, 10, 20))[0]!.dateLabel).toBe('6-7 Nov 2027');
    expect(e.lon).toBeGreaterThan(139.6);
    expect(e.lon).toBeLessThan(139.9);
    expect(e.lat).toBeGreaterThan(35.5);
    expect(e.lat).toBeLessThan(35.8);
    expect(e.highlights?.map((h) => h.name).join(' ')).toMatch(/Odaiba.*Marunouchi/);
  });
});
