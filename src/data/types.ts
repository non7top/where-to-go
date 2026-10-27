import type { RainLevel } from '../lib/rain';

export type Level = 'country' | 'province' | 'city' | 'island';
export type Equipment = 'yes' | 'partial' | 'no';
export type IconName =
  | 'maple' | 'ginkgo' | 'sakura' | 'book' | 'note' | 'drops' | 'lantern' | 'boat' | 'snow'
  | 'monitor' | 'moon' | 'grass' | 'calendar' | 'star' | 'booth'
  | 'fireworks' | 'lily' | 'wisteria' | 'hydrangea' | 'lavender' | 'sunflower' | 'plum' | 'cosmos' | 'firefly' | 'whale' | 'sun';
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

// How prominent an event is: 1 shows on the whole map, 2 from a regional zoom, 3 only when zoomed in.
export type Tier = 1 | 2 | 3;

export interface MapEvent {
  id: string;
  name: string;
  category: EventCategory;
  tier?: Tier;
  lon: number;
  lat: number;
  peaks?: Peak[];
  fronts?: Front[];
  links?: { wiki?: string; official?: string };
  icon?: IconName;
  // Extra names the search also matches.
  aliases?: string[];
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

export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

// A date that is worked out each year, such as the first Saturday of November.
export interface PeakRule {
  month: number;
  nth: number;
  weekday: Weekday;
}

// Either a fixed day of the year (`on`) or a weekday rule (`rule`, lasting `length` days from that day).
export interface Peak {
  on?: string;
  rule?: PeakRule;
  length?: number;
  spread: number;
}

// A season that sweeps across a country: the peak date follows latitude, with per-area overrides.
export interface Front {
  country: string;
  label?: string;
  aliases?: string[];
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
  // Shown only when zoomed in, so a cluster of close spots does not pile up in the region view.
  detail?: boolean;
}

export interface Shortcut {
  id: string;
  name: string;
  lon: number;
  lat: number;
  zoom: number;
}
