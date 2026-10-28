import type { AreaProps } from '../data/types';
import { pointInGeometry } from './geo';
import type { Geometry } from 'geojson';

// A city and its province are sampled at different points, so they can show very different weather.
export const CONTRAST_DEG = 6;

// The province a city's center lies in, by area id.
export function hostProvinces(
  areas: readonly { geometry: Geometry; properties: AreaProps }[],
): Map<string, string> {
  const provinces = areas.filter((a) => a.properties.level === 'province');
  const host = new Map<string, string>();
  for (const c of areas) {
    if (c.properties.level !== 'city') continue;
    const [lon, lat] = c.properties.point;
    const p = provinces.find((q) => q.properties.country === c.properties.country && pointInGeometry(lon, lat, q.geometry));
    if (p) host.set(c.properties.id, p.properties.id);
  }
  return host;
}

// The province's high when it is far from the city's, else null.
export function contrastingHigh(cityHi: number | null, hostHi: number | null): number | null {
  if (cityHi === null || hostHi === null) return null;
  return Math.abs(cityHi - hostHi) >= CONTRAST_DEG ? hostHi : null;
}
