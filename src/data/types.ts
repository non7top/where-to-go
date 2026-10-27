import type { RainLevel } from '../lib/rain';

export type Level = 'country' | 'province' | 'island';
export type Equipment = 'yes' | 'partial' | 'no';
export type EventCategory = 'festival' | 'fair' | 'seasonal' | 'holiday' | 'concert';

export interface AreaProps {
  id: string;
  name: string;
  level: Level;
  country: string;
  minzoom: number;
  maxzoom: number;
  point: [number, number];
}

export interface AreaClimate {
  hi: (number | null)[];
  lo: (number | null)[];
  rain: (number | null)[];
  rainLevel: (RainLevel | null)[];
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
  months: number[];
  when: string;
  approx?: boolean;
  summary: string;
  details?: string;
  crowd?: string;
  price?: string;
  perk?: string;
  areaId?: string;
}

export interface Shortcut {
  id: string;
  name: string;
  lon: number;
  lat: number;
  zoom: number;
}
