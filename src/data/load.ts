import type { FeatureCollection, Geometry } from 'geojson';
import type { AreaClimate, AreaProps, MapEvent, Shortcut } from './types';

export interface AppData {
  areas: FeatureCollection<Geometry, AreaProps>;
  land: FeatureCollection<Geometry>;
  climate: Record<string, AreaClimate>;
  events: MapEvent[];
  shortcuts: Shortcut[];
}

async function getJson<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

// The only place that knows where data comes from; a backend can replace these URLs later.
export async function loadAll(): Promise<AppData> {
  const [areas, land, climate, events, concerts, shortcuts] = await Promise.all([
    getJson<AppData['areas']>('areas.geojson'),
    getJson<AppData['land']>('land.geojson'),
    getJson<AppData['climate']>('climate.json'),
    getJson<MapEvent[]>('events.json'),
    getJson<MapEvent[]>('concerts.json'),
    getJson<Shortcut[]>('shortcuts.json'),
  ]);
  return { areas, land, climate, events: [...events, ...concerts], shortcuts };
}
