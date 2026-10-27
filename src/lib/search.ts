import type { AreaProps, IconName, MapEvent } from '../data/types';
import { iconFor } from './events';

export interface SearchItem {
  kind: 'area' | 'event';
  // Area id, or event id (with `|CC` for one country's front).
  id: string;
  label: string;
  sub: string;
  country?: string;
  icon?: IconName;
  hay: string;
  weight: number;
}

// Lower case, accents removed, anything but letters and digits turned into single spaces.
export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}+/gu, '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

const LEVEL_WEIGHT: Record<AreaProps['level'], number> = { city: 4, province: 3, island: 3, country: 2 };
const LEVEL_NAME: Record<AreaProps['level'], string> = { city: 'City', province: 'Region', island: 'Island', country: 'Country' };

export function buildSearchIndex(
  areas: readonly AreaProps[],
  events: readonly MapEvent[],
  countryName: (cc: string) => string,
): SearchItem[] {
  const items: SearchItem[] = [];
  for (const a of areas) {
    const country = countryName(a.country);
    items.push({
      kind: 'area',
      id: a.id,
      label: a.iata ? `${a.name} (${a.iata})` : a.name,
      sub: `${LEVEL_NAME[a.level]}, ${country}`,
      country: a.country,
      hay: fold(`${a.name} ${a.iata?.replaceAll('/', ' ') ?? ''} ${country}`),
      weight: LEVEL_WEIGHT[a.level],
    });
  }
  for (const e of events) {
    const icon = iconFor(e);
    const fronts = e.fronts ?? [];
    items.push({ kind: 'event', id: e.id, label: e.name, sub: e.when, icon, hay: fold(`${e.name} ${(e.aliases ?? []).join(' ')} ${fronts.map((f) => `${f.label ?? ''} ${(f.aliases ?? []).join(' ')}`).join(' ')}`), weight: 3.5 });
    for (const f of fronts) {
      if (!f.label) continue;
      items.push({
        kind: 'event',
        id: `${e.id}|${f.country}`,
        label: f.label,
        sub: `${e.name}, ${countryName(f.country)}`,
        country: f.country,
        icon,
        hay: fold(`${f.label} ${(f.aliases ?? []).join(' ')} ${e.name} ${countryName(f.country)}`),
        weight: 3.6,
      });
    }
  }
  return items;
}

// Every word of the query must appear; matches at the start of the label or of a word rank higher.
export function search(index: readonly SearchItem[], query: string, limit = 8): SearchItem[] {
  const q = fold(query);
  if (!q) return [];
  const tokens = q.split(' ');
  const scored: { item: SearchItem; score: number }[] = [];
  for (const item of index) {
    if (!tokens.every((t) => item.hay.includes(t))) continue;
    const label = fold(item.label);
    let score = item.weight;
    if (label.startsWith(q)) score += 100;
    else if (label.split(' ').some((w) => w.startsWith(tokens[0]!))) score += 60;
    else if (item.hay.split(' ').some((w) => w.startsWith(tokens[0]!))) score += 30;
    else score += 10;
    score -= label.length / 100;
    scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.item);
}
