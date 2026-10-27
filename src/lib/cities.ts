import type { AreaProps } from '../data/types';

export interface MenuItem {
  id: string;
  label: string;
  group?: string;
  groupCode?: string;
}

// City sectors grouped by country name, countries and cities sorted alphabetically.
export function cityMenuItems(areas: readonly AreaProps[], countryName: (cc: string) => string): MenuItem[] {
  return areas
    .filter((a) => a.level === 'city')
    .map((a) => ({ id: a.id, label: a.iata ? `${a.name} (${a.iata})` : a.name, group: countryName(a.country), groupCode: a.country }))
    .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
}

// Accepts any one of a city's airport codes, e.g. "icn" or "GMP" for Seoul.
export function findCityByCode(areas: readonly AreaProps[], code: string): AreaProps | undefined {
  const wanted = code.trim().toUpperCase();
  return areas.find((a) => a.level === 'city' && a.iata?.split('/').includes(wanted));
}
