import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildOccurrences } from '../src/lib/events';
import { dayFromMonthDay } from '../src/lib/season';
import type { AreaProps, MapEvent } from '../src/data/types';

const read = <T>(f: string): T => JSON.parse(readFileSync(`public/data/${f}`, 'utf8')) as T;
const areas = read<{ features: { properties: AreaProps }[] }>('areas.geojson').features.map((f) => f.properties);
const fronts = read<MapEvent[]>('fronts.json');
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
