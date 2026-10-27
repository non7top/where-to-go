import { describe, expect, it } from 'vitest';
import { rankGreen, scorePick } from '../src/lib/best';
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
