import { describe, expect, it } from 'vitest';
import { rankGreen, scorePick } from '../src/lib/best';
import { boundsFrom, boundsPolygon, inBounds, isTinyBox } from '../src/lib/scope';
import type { AreaClimate, AreaProps } from '../src/data/types';

describe('scorePick', () => {
  it('is highest at the ideal and zero outside the green band', () => {
    expect(scorePick(21.5, 0, null)).toBeGreaterThan(scorePick(25, 0, null));
    expect(scorePick(16, 0, null)).toBe(0);
    expect(scorePick(27, 0, null)).toBe(0);
  });
  it('lowers the score for rain and uses the comfort rating', () => {
    expect(scorePick(21.5, 3, null)).toBeLessThan(scorePick(21.5, 0, null));
    expect(scorePick(21.5, 0, 5)).toBeGreaterThan(scorePick(21.5, 0, 1));
  });
});

describe('rankGreen', () => {
  const flat = (hi: number): AreaClimate => ({
    hi: Array(12).fill(hi), lo: Array(12).fill(10), rain: Array(12).fill(20),
    rainLevel: Array(12).fill(0), cost: Array(12).fill(2),
  });
  const area = (id: string, level: AreaProps['level']): AreaProps => ({ id, name: id, level, country: 'JP', point: [0, 0] });
  const areas = [area('warm', 'city'), area('nice', 'city'), area('cold', 'city'), area('prov', 'province')];
  const climate = { warm: flat(25), nice: flat(21), cold: flat(5), prov: flat(21) };
  it('keeps only green areas of the requested levels, best first', () => {
    expect(rankGreen(areas, climate, 100, ['city']).map((p) => p.id)).toEqual(['nice', 'warm']);
    expect(rankGreen(areas, climate, 100, ['province']).map((p) => p.id)).toEqual(['prov']);
  });
  it('skips areas without climate data', () => {
    expect(rankGreen([area('none', 'city')], {}, 100, ['city'])).toEqual([]);
  });
});

describe('scope bounds', () => {
  it('normalises corners given in any order', () => {
    expect(boundsFrom([130, 40], [120, 30])).toEqual({ west: 120, east: 130, south: 30, north: 40 });
  });
  it('treats no bounds as everything and edges as inside', () => {
    const b = boundsFrom([120, 30], [130, 40]);
    expect(inBounds(null, 0, 0)).toBe(true);
    expect(inBounds(b, 125, 35)).toBe(true);
    expect(inBounds(b, 130, 40)).toBe(true);
    expect(inBounds(b, 131, 35)).toBe(false);
    expect(inBounds(b, 125, 29)).toBe(false);
  });
  it('ignores a click or a sliver as a selection', () => {
    expect(isTinyBox({ x: 10, y: 10 }, { x: 14, y: 90 })).toBe(true);
    expect(isTinyBox({ x: 10, y: 10 }, { x: 80, y: 90 })).toBe(false);
  });
  it('closes the polygon ring', () => {
    const ring = boundsPolygon(boundsFrom([1, 2], [3, 4]))[0]!;
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring).toHaveLength(5);
  });
});
