import { YEAR_DAYS } from './season';

export const RAD_PER_DAY = (2 * Math.PI) / YEAR_DAYS;
// A cylinder seen from the side shows its front half: a quarter of the year to each side of the center.
export const VISIBLE_DAYS = YEAR_DAYS / 4;

// Horizontal position of a point `offsetDays` from the center on a drum of radius R.
export const drumX = (offsetDays: number, radius: number): number => radius * Math.sin(offsetDays * RAD_PER_DAY);

// Foreshortening: 1 at the center, 0 at the edge where the surface turns away.
export const drumScale = (offsetDays: number): number => Math.max(0, Math.cos(offsetDays * RAD_PER_DAY));

export const onFront = (offsetDays: number): boolean => Math.abs(offsetDays) < VISIBLE_DAYS;

// Inverse of drumX: which day offset lies under a horizontal distance from the center.
export function dayAtX(dx: number, radius: number): number {
  return Math.asin(Math.max(-1, Math.min(1, dx / radius))) / RAD_PER_DAY;
}

// Signed offset in days from the center to a day, wrapped to -182.5..182.5.
export function offsetFrom(center: number, day: number): number {
  return ((((day - center + YEAR_DAYS / 2) % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS) - YEAR_DAYS / 2;
}
