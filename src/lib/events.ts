import type { MapEvent } from '../data/types';

export function eventsForMonth(events: readonly MapEvent[], month: number): MapEvent[] {
  return events.filter((e) => e.months.includes(month));
}

export const CATEGORY_LABELS: Record<MapEvent['category'], string> = {
  festival: 'Festival',
  fair: 'Fair / convention',
  seasonal: 'Seasonal sight',
  holiday: 'National holiday',
  concert: 'Concert',
};
