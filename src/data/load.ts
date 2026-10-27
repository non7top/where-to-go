import type { FeatureCollection, Geometry } from 'geojson';
import { buildOccurrences } from '../lib/events';
import type { Occurrence, StarPoint } from '../lib/events';
import type { AreaClimate, AreaProps, MapEvent, Shortcut } from './types';

export interface AppData {
  areas: FeatureCollection<Geometry, AreaProps>;
  land: FeatureCollection<Geometry>;
  climate: Record<string, AreaClimate>;
  events: MapEvent[];
  occurrences: Occurrence[];
  stars: StarPoint[];
  shortcuts: Shortcut[];
}

async function getJson<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

// The standalone build ships the files inlined in assets/data.js, because fetch() does not work from file://.
const inline = (globalThis as { __WTG_DATA__?: Record<string, unknown> }).__WTG_DATA__;
const read = <T>(name: string): Promise<T> => (inline ? Promise.resolve(inline[name] as T) : getJson<T>(name));

// The only place that knows where data comes from; a backend can replace these URLs later.
export async function loadAll(): Promise<AppData> {
  const [areas, land, climate, events, concerts, fronts, shortcuts] = await Promise.all([
    read<AppData['areas']>('areas.geojson'),
    read<AppData['land']>('land.geojson'),
    read<AppData['climate']>('climate.json'),
    read<MapEvent[]>('events.json'),
    read<MapEvent[]>('concerts.json'),
    read<MapEvent[]>('fronts.json'),
    read<Shortcut[]>('shortcuts.json'),
  ]);
  const all = [...events, ...concerts, ...fronts];
  const { occurrences, stars } = buildOccurrences(all, areas.features.map((f) => f.properties));
  return { areas, land, climate, events: all, occurrences, stars, shortcuts };
}
