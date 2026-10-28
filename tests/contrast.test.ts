import { describe, expect, it } from 'vitest';
import { CONTRAST_DEG, contrastingHigh, hostProvinces } from '../src/lib/contrast';
import type { AreaProps } from '../src/data/types';

const square = (x: number, y: number, s: number) => ({
  type: 'Polygon' as const,
  coordinates: [[[x - s, y - s], [x + s, y - s], [x + s, y + s], [x - s, y + s], [x - s, y - s]]],
});
const area = (id: string, level: AreaProps['level'], country: string, point: [number, number], s: number) => ({
  geometry: square(point[0], point[1], s),
  properties: { id, name: id, level, country, point } as AreaProps,
});

describe('city versus province', () => {
  it('finds the province around each city, within its own country', () => {
    const host = hostProvinces([
      area('prov-a', 'province', 'CN', [100, 30], 5),
      area('prov-b', 'province', 'CN', [120, 30], 5),
      area('prov-c', 'province', 'VN', [101, 30], 5),
      area('city-a', 'city', 'CN', [102, 31], 0.2),
      area('city-x', 'city', 'CN', [150, 50], 0.2),
    ]);
    expect(host.get('city-a')).toBe('prov-a');
    expect(host.has('city-x')).toBe(false);
  });
  it('reports the province high only when it differs by the threshold or more', () => {
    expect(contrastingHigh(28, 14)).toBe(14);
    expect(contrastingHigh(20, 20 + CONTRAST_DEG)).toBe(26);
    expect(contrastingHigh(20, 20 + CONTRAST_DEG - 0.1)).toBeNull();
    expect(contrastingHigh(null, 10)).toBeNull();
    expect(contrastingHigh(10, null)).toBeNull();
  });
});
