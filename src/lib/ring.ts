import { YEAR_DAYS } from './season';

export const dayToDeg = (days: number): number => (days / YEAR_DAYS) * 360;
export const degToDay = (deg: number): number => (deg / 360) * YEAR_DAYS;

// Degrees clockwise from 12 o'clock.
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export function pointerDeg(cx: number, cy: number, x: number, y: number): number {
  return (Math.atan2(x - cx, -(y - cy)) * 180) / Math.PI;
}

// Signed shortest turn from one angle to another, in -180..180.
export function turn(fromDeg: number, toDeg: number): number {
  return ((((toDeg - fromDeg) % 360) + 540) % 360) - 180;
}

const f = (n: number) => n.toFixed(2);

// Annular sector from angle a0 to a1 (clockwise, a1 > a0), between radii r0 and r1.
export function sectorPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const end = Math.min(a1, a0 + 359.9);
  const large = end - a0 > 180 ? 1 : 0;
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, end);
  const [x2, y2] = polar(cx, cy, r0, end);
  const [x3, y3] = polar(cx, cy, r0, a0);
  return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 ${large} 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 ${large} 0 ${f(x3)} ${f(y3)}Z`;
}
