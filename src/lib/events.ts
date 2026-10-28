import type { AreaProps, IconName, MapEvent, Tier } from '../data/types';
import { dateLabel, dayFromMonthDay, dayOfYear, isActive, nthWeekday } from './season';

export const CATEGORY_LABELS: Record<MapEvent['category'], string> = {
  festival: 'Festival',
  fair: 'Fair / convention',
  seasonal: 'Seasonal sight',
  holiday: 'National holiday',
  concert: 'Concert',
};

export const EVENT_TYPES = Object.keys(CATEGORY_LABELS) as MapEvent['category'][];

const DEFAULT_ICON: Record<MapEvent['category'], IconName> = {
  festival: 'star',
  fair: 'booth',
  seasonal: 'sakura',
  holiday: 'calendar',
  concert: 'note',
};

// Map zoom from which each tier is drawn.
export const TIER_MINZOOM: Record<Tier, number> = { 1: 0, 2: 5, 3: 6.5 };

// An event's own icon, else the default for its category.
export function iconFor(e: Pick<MapEvent, 'icon' | 'category'>): IconName {
  return e.icon ?? DEFAULT_ICON[e.category];
}

export interface Occurrence {
  eventId: string;
  lon: number;
  lat: number;
  day: number;
  spread: number;
  areaId?: string;
  country?: string;
  // Country the place is in, for the flag; `country` is only set for events that cover a whole country.
  home: string;
  label?: string;
  tier: Tier;
  // For a date worked out by rule: the actual date, e.g. "7-8 Nov 2026".
  dateLabel?: string;
}

export interface StarPoint {
  eventId: string;
  tier: Tier;
  name: string;
  lon: number;
  lat: number;
  day: number;
  spread: number;
  detail?: boolean;
}

export interface PeakWindow {
  day: number;
  spread: number;
  dateLabel?: string;
}

// The next occurrence of each peak from `now`: a fixed day, or a weekday rule worked out for this year
// (or next year once this year's window has passed).
export function peakWindows(e: Pick<MapEvent, 'peaks'>, now: Date): PeakWindow[] {
  return (e.peaks ?? []).map((p) => {
    if (p.dates?.length) {
      const length = p.length ?? 1;
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const starts = p.dates.map((d) => {
        const [y, m, dd] = d.split('-').map(Number);
        return new Date(y!, m! - 1, dd);
      }).sort((a, b) => a.getTime() - b.getTime());
      const start = starts.find((s) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + length - 1 + p.spread) >= today) ?? starts[starts.length - 1]!;
      return { day: dayOfYear(start), spread: p.spread, dateLabel: dateLabel(start, length) };
    }
    if (!p.rule) return { day: dayFromMonthDay(p.on ?? '01-01'), spread: p.spread };
    const length = p.length ?? 1;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const at = (year: number) => nthWeekday(year, p.rule!.month, p.rule!.nth, p.rule!.weekday);
    let start = at(now.getFullYear());
    const over = new Date(start.getFullYear(), start.getMonth(), start.getDate() + length - 1 + p.spread);
    if (over < today) start = at(now.getFullYear() + 1);
    return { day: dayOfYear(start), spread: p.spread, dateLabel: dateLabel(start, length) };
  });
}

// Peak day along a latitude table: linear between anchors, flat beyond the ends.
export function peakFromAnchors(lat: number, anchors: readonly [number, string][]): number {
  const pts = anchors.map(([a, md]) => [a, dayFromMonthDay(md)] as const).sort((x, y) => x[0] - y[0]);
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  if (lat <= first[0]) return first[1];
  if (lat >= last[0]) return last[1];
  for (let i = 1; i < pts.length; i++) {
    const [l1, d1] = pts[i]!;
    const [l0, d0] = pts[i - 1]!;
    if (lat <= l1) return d0 + ((d1 - d0) * (lat - l0)) / (l1 - l0);
  }
  return last[1];
}

// Country of the area whose center is nearest, with longitude scaled to ground distance.
export function nearestCountry(lon: number, lat: number, areas: readonly AreaProps[]): string {
  const k = Math.cos((lat * Math.PI) / 180);
  let best = '';
  let bestD = Infinity;
  for (const a of areas) {
    if (a.level === 'country') continue;
    const d = ((a.point[0] - lon) * k) ** 2 + (a.point[1] - lat) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a.country;
    }
  }
  return best;
}

// Expands events into dated places: single peaks, per-province front peaks, and highlight stars.
export function buildOccurrences(
  events: readonly MapEvent[],
  areas: readonly AreaProps[],
  now: Date = new Date(),
): { occurrences: Occurrence[]; stars: StarPoint[] } {
  const occurrences: Occurrence[] = [];
  const stars: StarPoint[] = [];
  for (const e of events) {
    const tier = e.tier ?? 1;
    const windows = peakWindows(e, now);
    // A nationwide event is drawn in each major city of its country; one point only if the country has none.
    const cities = e.country ? areas.filter((a) => a.level === 'city' && a.country === e.country) : [];
    const places = cities.length ? cities.map((a) => ({ lon: a.point[0], lat: a.point[1] })) : [{ lon: e.lon, lat: e.lat }];
    for (const w of windows) {
      for (const at of places) {
        occurrences.push({ eventId: e.id, lon: at.lon, lat: at.lat, day: w.day, spread: w.spread, country: e.country, home: e.country ?? nearestCountry(at.lon, at.lat, areas), tier, dateLabel: w.dateLabel });
      }
    }
    for (const f of e.fronts ?? []) {
      const overrides = new Map((f.overrides ?? []).map((o) => [o.areaId, o]));
      for (const a of areas) {
        if (a.level !== 'province' || a.country !== f.country) continue;
        const o = overrides.get(a.id);
        if (!o && f.minLat !== undefined && a.point[1] < f.minLat) continue;
        const day = o ? dayFromMonthDay(o.on) : peakFromAnchors(a.point[1], f.anchors);
        occurrences.push({ eventId: e.id, lon: a.point[0], lat: a.point[1], day, spread: o?.spread ?? f.spread, areaId: a.id, country: f.country, home: f.country, label: f.label, tier });
      }
    }
    for (const h of e.highlights ?? []) {
      const own = h.on ? [{ day: dayFromMonthDay(h.on), spread: h.spread ?? 7 }] : windows;
      for (const w of own) {
        stars.push({ eventId: e.id, name: h.name, lon: h.lon, lat: h.lat, day: w.day, spread: w.spread, detail: h.detail, tier });
      }
    }
  }
  return { occurrences, stars };
}

export function activeAt<T extends { day: number; spread: number }>(items: readonly T[], centerDay: number): T[] {
  return items.filter((o) => isActive(o.day, o.spread, centerDay));
}
