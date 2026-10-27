import type { Equipment } from '../data/types';

export type NightFlag = 'cold' | 'hot' | null;

export const NIGHT_LIMITS = { coldNoHeating: 8, coldPartialHeating: 3, hotNoCooling: 26, hotPartialCooling: 28 } as const;

// Flags a night that is likely uncomfortable indoors; does not affect the map color.
export function nightFlag(
  lo: number | null,
  heating?: Equipment,
  cooling?: Equipment,
): NightFlag {
  if (lo === null) return null;
  if (heating === 'no' && lo <= NIGHT_LIMITS.coldNoHeating) return 'cold';
  if (heating === 'partial' && lo <= NIGHT_LIMITS.coldPartialHeating) return 'cold';
  if (cooling === 'no' && lo >= NIGHT_LIMITS.hotNoCooling) return 'hot';
  if (cooling === 'partial' && lo >= NIGHT_LIMITS.hotPartialCooling) return 'hot';
  return null;
}
