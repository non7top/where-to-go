import type { Geometry } from 'geojson';
import { describe, expect, it } from 'vitest';
import { pointInGeometry } from '../src/lib/geo';

const square = [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]];
const hole = [[2, 2], [4, 2], [4, 4], [2, 4], [2, 2]];

describe('pointInGeometry', () => {
  it('detects points in and out of a polygon', () => {
    expect(pointInGeometry(5, 5, { type: 'Polygon', coordinates: square })).toBe(true);
    expect(pointInGeometry(15, 5, { type: 'Polygon', coordinates: square })).toBe(false);
  });
  it('respects holes', () => {
    const g: Geometry = { type: 'Polygon', coordinates: [...square, hole] };
    expect(pointInGeometry(3, 3, g)).toBe(false);
    expect(pointInGeometry(6, 6, g)).toBe(true);
  });
  it('handles multipolygons and other geometry', () => {
    const far = [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]];
    const g: Geometry = { type: 'MultiPolygon', coordinates: [square, far] };
    expect(pointInGeometry(25, 25, g)).toBe(true);
    expect(pointInGeometry(15, 15, g)).toBe(false);
    expect(pointInGeometry(1, 1, { type: 'Point', coordinates: [1, 1] })).toBe(false);
  });
});
