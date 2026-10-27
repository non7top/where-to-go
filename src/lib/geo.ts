import type { Geometry, Position } from 'geojson';

function inRing(x: number, y: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi! > y !== yj! > y && x < ((xj! - xi!) * (y - yi!)) / (yj! - yi!) + xi!) inside = !inside;
  }
  return inside;
}

function inPolygon(x: number, y: number, rings: Position[][]): boolean {
  const [outer, ...holes] = rings;
  if (!outer || !inRing(x, y, outer)) return false;
  return !holes.some((h) => inRing(x, y, h));
}

export function pointInGeometry(lon: number, lat: number, g: Geometry): boolean {
  if (g.type === 'Polygon') return inPolygon(lon, lat, g.coordinates);
  if (g.type === 'MultiPolygon') return g.coordinates.some((p) => inPolygon(lon, lat, p));
  return false;
}

export type Bbox = [number, number, number, number];

export function bboxOf(g: Geometry): Bbox {
  const box: Bbox = [Infinity, Infinity, -Infinity, -Infinity];
  const walk = (c: unknown): void => {
    if (typeof (c as number[])[0] === 'number') {
      const [x, y] = c as number[];
      box[0] = Math.min(box[0], x!);
      box[1] = Math.min(box[1], y!);
      box[2] = Math.max(box[2], x!);
      box[3] = Math.max(box[3], y!);
    } else for (const part of c as unknown[]) walk(part);
  };
  if (g.type === 'Polygon' || g.type === 'MultiPolygon') walk(g.coordinates);
  return box;
}
