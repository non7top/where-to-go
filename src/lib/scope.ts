export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type LonLat = readonly [number, number];

// Both corners of a dragged rectangle, in any order.
export function boundsFrom(a: LonLat, b: LonLat): Bounds {
  return {
    west: Math.min(a[0], b[0]),
    east: Math.max(a[0], b[0]),
    south: Math.min(a[1], b[1]),
    north: Math.max(a[1], b[1]),
  };
}

// No bounds means no narrowing: everything is inside.
export function inBounds(b: Bounds | null, lon: number, lat: number): boolean {
  return !b || (lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north);
}

export const MIN_BOX_PX = 12;

export function isTinyBox(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) < MIN_BOX_PX || Math.abs(a.y - b.y) < MIN_BOX_PX;
}

export function boundsPolygon(b: Bounds): [number, number][][] {
  return [[[b.west, b.south], [b.east, b.south], [b.east, b.north], [b.west, b.north], [b.west, b.south]]];
}
