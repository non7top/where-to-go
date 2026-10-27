import { describe, expect, it } from 'vitest';
import { DAYS_LIMIT, etaText, etaToDay } from '../src/lib/timeuntil';
import {
  circDist, dayFromMonthDay, dayLabel, dayOfYear, interpMonthly, isActive, MID_DAY, monthOfDay, sectionLabel, seasonOf, SEASONS, wrapDay,
} from '../src/lib/season';
import { buildOccurrences, peakFromAnchors } from '../src/lib/events';
import { dayToDeg, degToDay, pointerDeg, polar, sectorPath, turn } from '../src/lib/ring';
import { dayAtX, drumScale, drumX, offsetFrom, onFront, VISIBLE_DAYS } from '../src/lib/dial';
import type { AreaProps, MapEvent } from '../src/data/types';

describe('days of the year', () => {
  it('converts dates both ways', () => {
    expect(dayFromMonthDay('01-01')).toBe(0);
    expect(dayFromMonthDay('03-29')).toBe(31 + 28 + 28);
    expect(dayOfYear(new Date(2026, 9, 27))).toBe(dayFromMonthDay('10-27'));
    expect(() => dayFromMonthDay('13-01')).toThrow();
    expect(() => dayFromMonthDay('02-30')).toThrow();
  });
  it('wraps and measures around the year end', () => {
    expect(wrapDay(-1)).toBe(364);
    expect(wrapDay(365)).toBe(0);
    expect(circDist(2, 363)).toBe(4);
  });
  it('finds the month and labels sections', () => {
    expect(monthOfDay(dayFromMonthDay('04-14'))).toBe(4);
    expect(monthOfDay(364)).toBe(12);
    expect(dayLabel(dayFromMonthDay('04-14'))).toBe('14 Apr');
    expect(sectionLabel(dayFromMonthDay('04-14'))).toBe('7-21 Apr');
    expect(sectionLabel(dayFromMonthDay('04-02'))).toBe('26 Mar - 9 Apr');
    expect(sectionLabel(dayFromMonthDay('01-03'))).toBe('27 Dec - 10 Jan');
  });
});

describe('interpMonthly', () => {
  const v = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
  it('hits the monthly value at mid-month and blends between', () => {
    expect(interpMonthly(v, MID_DAY[0]!)).toBeCloseTo(10, 5);
    expect(interpMonthly(v, MID_DAY[5]!)).toBeCloseTo(60, 5);
    const mid = (MID_DAY[0]! + MID_DAY[1]!) / 2;
    expect(interpMonthly(v, mid)).toBeCloseTo(15, 5);
  });
  it('wraps December to January', () => {
    const mid = (MID_DAY[11]! + MID_DAY[0]! + 365) / 2;
    expect(interpMonthly(v, mid)).toBeCloseTo(65, 5);
    expect(interpMonthly(v, 2)).toBeGreaterThan(10);
    expect(interpMonthly(v, 2)).toBeLessThan(120);
  });
  it('copes with a missing neighbour', () => {
    const w = [null, 20, ...Array(10).fill(30)] as (number | null)[];
    expect(interpMonthly(w, MID_DAY[0]! + 5)).toBe(20);
    expect(interpMonthly(Array(12).fill(null), 100)).toBeNull();
  });
});

describe('peak and spread', () => {
  it('is active within the spread plus the half window', () => {
    const peak = dayFromMonthDay('03-29');
    expect(isActive(peak, 7, peak + 14)).toBe(true);
    expect(isActive(peak, 7, peak + 15)).toBe(false);
    expect(isActive(peak, 0, peak - 7)).toBe(true);
    expect(isActive(peak, 0, peak - 8)).toBe(false);
  });
  it('works across the year end', () => {
    expect(isActive(dayFromMonthDay('12-30'), 1, dayFromMonthDay('01-05'))).toBe(true);
  });
});

describe('fronts', () => {
  const anchors: [number, string][] = [[30, '03-20'], [40, '04-20']];
  it('interpolates the peak by latitude and clamps beyond the table', () => {
    expect(peakFromAnchors(30, anchors)).toBe(dayFromMonthDay('03-20'));
    expect(peakFromAnchors(35, anchors)).toBeCloseTo((dayFromMonthDay('03-20') + dayFromMonthDay('04-20')) / 2, 5);
    expect(peakFromAnchors(10, anchors)).toBe(dayFromMonthDay('03-20'));
    expect(peakFromAnchors(60, anchors)).toBe(dayFromMonthDay('04-20'));
  });
  const area = (id: string, lat: number, country = 'JP'): AreaProps => ({ id, name: id, level: 'province', country, point: [135, lat] });
  const event: MapEvent = {
    id: 'bloom', name: 'Bloom', category: 'seasonal', lon: 0, lat: 0, when: '', summary: '',
    fronts: [{ country: 'JP', anchors, spread: 7, minLat: 31, overrides: [{ areaId: 'special', on: '05-01', spread: 3 }] }],
    highlights: [{ name: 'Spot', lon: 1, lat: 2, on: '04-01' }],
  };
  it('builds one occurrence per area, honouring minLat, overrides and country', () => {
    const { occurrences, stars } = buildOccurrences(
      [event],
      [area('low', 30.5), area('mid', 35), area('special', 30.5), area('abroad', 35, 'KR')],
    );
    expect(occurrences.map((o) => o.areaId).sort()).toEqual(['mid', 'special']);
    expect(occurrences.find((o) => o.areaId === 'special')).toMatchObject({ day: dayFromMonthDay('05-01'), spread: 3 });
    expect(stars).toEqual([{ eventId: 'bloom', name: 'Spot', lon: 1, lat: 2, day: dayFromMonthDay('04-01'), spread: 7 }]);
  });
  it('uses the event peaks for highlights without their own date', () => {
    const e: MapEvent = {
      id: 'e', name: 'E', category: 'festival', lon: 5, lat: 6, when: '', summary: '',
      peaks: [{ on: '04-14', spread: 1 }], highlights: [{ name: 'A', lon: 1, lat: 2 }],
    };
    const { occurrences, stars } = buildOccurrences([e], []);
    expect(occurrences).toHaveLength(1);
    expect(stars[0]).toMatchObject({ day: dayFromMonthDay('04-14'), spread: 1 });
  });
});

describe('etaToDay', () => {
  const today = new Date(2026, 9, 27);
  const at = (md: string) => etaToDay(today, dayFromMonthDay(md));
  it('is now when the section reaches today', () => {
    expect(at('10-27')).toEqual({ kind: 'now' });
    expect(at('11-03')).toEqual({ kind: 'now' });
    expect(at('10-20')).toEqual({ kind: 'now' });
  });
  it('counts days until the section starts while within 45 days', () => {
    expect(at('11-15')).toEqual({ kind: 'days', n: 12 });
    expect(DAYS_LIMIT).toBe(45);
  });
  it('switches to months beyond 45 days', () => {
    expect(at('01-15')).toEqual({ kind: 'months', n: 2 });
    expect(at('09-15')).toEqual({ kind: 'months', n: 10 });
  });
  it('formats each kind', () => {
    expect(etaText({ kind: 'now' })).toBe('Now');
    expect(etaText({ kind: 'days', n: 1 })).toBe('in 1 day');
    expect(etaText({ kind: 'months', n: 3 })).toBe('in 3 months');
  });
});

describe('drum geometry', () => {
  it('puts the center at 0 and the edge of the front half at the radius', () => {
    expect(drumX(0, 300)).toBe(0);
    expect(drumX(VISIBLE_DAYS, 300)).toBeCloseTo(300, 5);
    expect(drumX(-VISIBLE_DAYS, 300)).toBeCloseTo(-300, 5);
  });
  it('squeezes toward the edges and hides the back', () => {
    expect(drumScale(0)).toBe(1);
    expect(drumScale(VISIBLE_DAYS)).toBeCloseTo(0, 5);
    expect(drumScale(40)).toBeLessThan(drumScale(10));
    expect(onFront(90)).toBe(true);
    expect(onFront(92)).toBe(false);
  });
  it('maps a position back to a day offset', () => {
    expect(dayAtX(drumX(30, 300), 300)).toBeCloseTo(30, 5);
    expect(dayAtX(-drumX(55, 300), 300)).toBeCloseTo(-55, 5);
    expect(dayAtX(9999, 300)).toBeCloseTo(VISIBLE_DAYS, 5);
  });
  it('wraps offsets around the year', () => {
    expect(offsetFrom(10, 360)).toBe(-15);
    expect(offsetFrom(360, 10)).toBe(15);
    expect(offsetFrom(100, 100)).toBe(0);
  });
});

describe('ring geometry', () => {
  it('converts between days and degrees', () => {
    expect(dayToDeg(365)).toBe(360);
    expect(degToDay(180)).toBeCloseTo(182.5, 5);
  });
  it('places points clockwise from the top', () => {
    const [x, y] = polar(100, 100, 50, 0);
    expect(x).toBeCloseTo(100, 5);
    expect(y).toBeCloseTo(50, 5);
    expect(polar(100, 100, 50, 90)[0]).toBeCloseTo(150, 5);
  });
  it('reads pointer angles and the shortest turn', () => {
    expect(pointerDeg(100, 100, 150, 100)).toBeCloseTo(90, 5);
    expect(turn(350, 10)).toBe(20);
    expect(turn(10, 350)).toBe(-20);
  });
  it('draws a closed sector path', () => {
    const d = sectorPath(100, 100, 50, 80, 10, 40);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });
});

describe('seasons', () => {
  it('cover the whole year exactly once', () => {
    expect(SEASONS.reduce((a, s) => a + s.len, 0)).toBe(365);
  });
  it('are meteorological, with winter wrapping the year end', () => {
    expect(seasonOf(dayFromMonthDay('04-14')).name).toBe('Spring');
    expect(seasonOf(dayFromMonthDay('07-17')).name).toBe('Summer');
    expect(seasonOf(dayFromMonthDay('10-27')).name).toBe('Autumn');
    expect(seasonOf(dayFromMonthDay('12-01')).name).toBe('Winter');
    expect(seasonOf(dayFromMonthDay('01-20')).name).toBe('Winter');
    expect(seasonOf(dayFromMonthDay('02-28')).name).toBe('Winter');
    expect(seasonOf(dayFromMonthDay('03-01')).name).toBe('Spring');
  });
});
