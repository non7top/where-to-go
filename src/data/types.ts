import type { RainLevel } from '../lib/rain';

export type Level = 'country' | 'province' | 'city' | 'island';
export type Equipment = 'yes' | 'partial' | 'no';
export type EventCategory = 'festival' | 'fair' | 'seasonal' | 'holiday' | 'concert';

export interface AreaProps {
  id: string;
  name: string;
  level: Level;
  country: string;
  point: [number, number];
  iata?: string;
}

export interface AreaClimate {
  hi: (number | null)[];
  lo: (number | null)[];
  rain: (number | null)[];
  rainLevel: (RainLevel | null)[];
  wind?: (number | null)[];
  cost: (1 | 2 | 3)[];
  comfort?: (number | null)[];
  heating?: Equipment;
  cooling?: Equipment;
}

export interface MapEvent {
  id: string;
  name: string;
  category: EventCategory;
  lon: number;
  lat: number;
  peaks?: Peak[];
  fronts?: Front[];
  links?: { wiki?: string; official?: string };
  when: string;
  approx?: boolean;
  summary: string;
  details?: string;
  crowd?: string;
  price?: string;
  perk?: string;
  areaId?: string;
  country?: string;
  highlights?: Highlight[];
}

export interface Peak {
  on: string;
  spread: number;
}

// A season that sweeps across a country: the peak date follows latitude, with per-area overrides.
export interface Front {
  country: string;
  anchors: [number, string][];
  spread: number;
  minLat?: number;
  overrides?: { areaId: string; on: string; spread?: number }[];
}

export interface Highlight {
  name: string;
  lon: number;
  lat: number;
  note?: string;
  on?: string;
  spread?: number;
}

export interface Shortcut {
  id: string;
  name: string;
  lon: number;
  lat: number;
  zoom: number;
}
