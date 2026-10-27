import { describe, expect, it } from 'vitest';
import { buildSearchIndex, fold, search } from '../src/lib/search';
import type { AreaProps, MapEvent } from '../src/data/types';

const area = (id: string, name: string, level: AreaProps['level'], country: string, iata?: string): AreaProps => ({ id, name, level, country, point: [0, 0], iata });
const areas = [
  area('city-icn', 'Seoul', 'city', 'KR', 'ICN/GMP'),
  area('prov-seoul', 'Seoul', 'province', 'KR'),
  area('city-pus', 'Busan', 'city', 'KR', 'PUS'),
  area('prov-kyoto', 'Kyōto', 'province', 'JP'),
  area('country-kr', 'South Korea', 'country', 'KR'),
];
const names: Record<string, string> = { KR: 'South Korea', JP: 'Japan', CN: 'China' };
const events: MapEvent[] = [
  {
    id: 'momiji', name: 'Autumn leaves', category: 'seasonal', icon: 'maple', lon: 0, lat: 0, when: 'autumn', summary: '',
    fronts: [
      { country: 'JP', spread: 7, anchors: [[30, '11-01'], [40, '10-20']], label: '紅葉 (Momiji)' },
      { country: 'KR', spread: 7, anchors: [[33, '11-05'], [38, '10-18']], label: '단풍 (Danpung)', aliases: ["hong'yeop", '홍엽', 'momiji'] },
      { country: 'CN', spread: 7, anchors: [[30, '11-25'], [47, '10-05']], label: '红叶 (Hongye)', aliases: ['hóngyè', '紅葉', 'momiji'] },
    ],
  },
  { id: 'comiket', name: 'Comiket', category: 'fair', lon: 0, lat: 0, when: 'August', summary: '', peaks: [{ on: '08-13', spread: 1 }] },
];
const index = buildSearchIndex(areas, events, (cc) => names[cc] ?? cc);

describe('fold', () => {
  it('removes accents and punctuation but keeps other scripts', () => {
    expect(fold('Kyōto  (City)')).toBe('kyoto city');
    expect(fold('단풍')).toBe('단풍');
    expect(fold('红叶')).toBe('红叶');
  });
});

describe('search', () => {
  it('finds places by name, airport code and country', () => {
    expect(search(index, 'busan')[0]?.id).toBe('city-pus');
    expect(search(index, 'gmp')[0]?.id).toBe('city-icn');
    expect(search(index, 'kyoto')[0]?.id).toBe('prov-kyoto');
    expect(search(index, 'south korea').map((r) => r.id)).toContain('country-kr');
  });
  it('ranks the city above the province of the same name', () => {
    expect(search(index, 'seoul').map((r) => r.id).slice(0, 2)).toEqual(['city-icn', 'prov-seoul']);
  });
  it('finds events by their local names in each country', () => {
    expect(search(index, 'danpung')[0]).toMatchObject({ id: 'momiji|KR', kind: 'event' });
    expect(search(index, '红叶')[0]?.id).toBe('momiji|CN');
    expect(search(index, 'momiji').map((r) => r.id)).toEqual(expect.arrayContaining(['momiji|JP', 'momiji|KR', 'momiji|CN']));
    expect(search(index, 'momiji')[0]?.id).toBe('momiji|JP');
    expect(search(index, 'comiket')[0]?.id).toBe('comiket');
  });
  it('finds a season by its other names', () => {
    expect(search(index, "hong'yeop")[0]?.id).toBe('momiji|KR');
    expect(search(index, '홍엽')[0]?.id).toBe('momiji|KR');
    expect(search(index, 'hóngyè')[0]?.id).toBe('momiji|CN');
    expect(search(index, '紅葉').map((r) => r.id)).toContain('momiji|CN');
  });
  it('needs every word and ignores an empty query', () => {
    expect(search(index, 'seoul busan')).toEqual([]);
    expect(search(index, '  ')).toEqual([]);
  });
  it('limits the number of results', () => {
    expect(search(index, 'o', 3)).toHaveLength(3);
  });
});
