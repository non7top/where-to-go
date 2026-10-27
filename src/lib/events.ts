import type { AreaProps, MapEvent } from '../data/types';
import { dayFromMonthDay, isActive } from './season';

export const CATEGORY_LABELS: Record<MapEvent['category'], string> = {
  festival: 'Festival',
  fair: 'Fair / convention',
  seasonal: 'Seasonal sight',
  holiday: 'National holiday',
  concert: 'Concert',
};

export interface Occurrence {
  eventId: string;
  lon: number;
  lat: number;
  day: number;
  spread: number;
  areaId?: string;
}

export interface StarPoint {
  eventId: string;
  name: string;
  lon: number;
  lat: number;
  day: number;
  spread: number;
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

// Expands events into dated places: single peaks, per-province front peaks, and highlight stars.
export function buildOccurrences(
  events: readonly MapEvent[],
  areas: readonly AreaProps[],
): { occurrences: Occurrence[]; stars: StarPoint[] } {
  const occurrences: Occurrence[] = [];
  const stars: StarPoint[] = [];
  for (const e of events) {
    for (const p of e.peaks ?? []) {
      occurrences.push({ eventId: e.id, lon: e.lon, lat: e.lat, day: dayFromMonthDay(p.on), spread: p.spread });
    }
    for (const f of e.fronts ?? []) {
      const overrides = new Map((f.overrides ?? []).map((o) => [o.areaId, o]));
      for (const a of areas) {
        if (a.level !== 'province' || a.country !== f.country) continue;
        const o = overrides.get(a.id);
        if (!o && f.minLat !== undefined && a.point[1] < f.minLat) continue;
        const day = o ? dayFromMonthDay(o.on) : peakFromAnchors(a.point[1], f.anchors);
        occurrences.push({ eventId: e.id, lon: a.point[0], lat: a.point[1], day, spread: o?.spread ?? f.spread, areaId: a.id });
      }
    }
    for (const h of e.highlights ?? []) {
      const windows = h.on ? [{ on: h.on, spread: h.spread ?? 7 }] : (e.peaks ?? []);
      for (const w of windows) {
        stars.push({ eventId: e.id, name: h.name, lon: h.lon, lat: h.lat, day: dayFromMonthDay(w.on), spread: w.spread });
      }
    }
  }
  return { occurrences, stars };
}

export function activeAt<T extends { day: number; spread: number }>(items: readonly T[], centerDay: number): T[] {
  return items.filter((o) => isActive(o.day, o.spread, centerDay));
}
