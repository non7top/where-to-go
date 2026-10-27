import { describe, expect, it } from 'vitest';
import { cityMenuItems, findCityByCode } from '../src/lib/cities';
import type { AreaProps } from '../src/data/types';

const area = (p: Partial<AreaProps>): AreaProps => ({ id: 'x', name: 'X', level: 'city', country: 'KR', point: [0, 0], ...p });
const areas: AreaProps[] = [
  area({ id: 'city-pus', name: 'Busan', iata: 'PUS' }),
  area({ id: 'city-icn', name: 'Seoul', iata: 'ICN/GMP' }),
  area({ id: 'city-hnd', name: 'Tokyo', iata: 'HND/NRT', country: 'JP' }),
  area({ id: 'prov-seoul', name: 'Seoul', level: 'province' }),
];
const names: Record<string, string> = { KR: 'South Korea', JP: 'Japan' };

describe('cityMenuItems', () => {
  it('lists only cities, grouped by country and sorted', () => {
    const items = cityMenuItems(areas, (cc) => names[cc]!);
    expect(items.map((i) => `${i.group}: ${i.label}`)).toEqual([
      'Japan: Tokyo (HND/NRT)',
      'South Korea: Busan (PUS)',
      'South Korea: Seoul (ICN/GMP)',
    ]);
  });
});

describe('findCityByCode', () => {
  it('matches any airport code of a city, case-insensitively', () => {
    expect(findCityByCode(areas, 'gmp')?.id).toBe('city-icn');
    expect(findCityByCode(areas, 'PUS')?.id).toBe('city-pus');
  });
  it('ignores non-city areas and unknown codes', () => {
    expect(findCityByCode(areas, 'XYZ')).toBeUndefined();
  });
});
