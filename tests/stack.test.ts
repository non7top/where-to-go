import { describe, expect, it } from 'vitest';
import { CELL_PX, GROUP_PX, MAX_PARTS, badgePx, sectorAt, stackPoints } from '../src/lib/stack';
import type { StackPoint } from '../src/lib/stack';

const pt = (x: number, y: number, key: string, index: number): StackPoint => ({ x, y, key, index });
const many = (n: number, x = 0, base = 0) => Array.from({ length: n }, (_, i) => pt(x, 0, `e${base + i}`, base + i));

describe('stackPoints', () => {
  it('keeps far apart points in separate groups', () => {
    const stacks = stackPoints([pt(0, 0, 'a', 0), pt(GROUP_PX + 5, 0, 'b', 1)]);
    expect(stacks).toHaveLength(2);
    expect(stacks[0]!.cells).toEqual([{ index: 0, dx: 0, dy: 0 }]);
  });

  it('does not combine one or two events: they stay separate icons, side by side', () => {
    const [two] = stackPoints(many(2));
    expect(two!.cells.map((c) => [c.index, c.dx, c.dy])).toEqual([
      [0, -CELL_PX / 2, 0],
      [1, CELL_PX / 2, 0],
    ]);
    expect(two!.cells.every((c) => c.members === undefined)).toBe(true);
  });

  it('shows one icon per event in a group', () => {
    const [stack] = stackPoints([pt(0, 0, 'maple', 0), pt(2, 1, 'maple', 1), pt(3, 0, 'ginkgo', 2)]);
    expect(stack!.cells.map((c) => c.index)).toEqual([0, 2]);
  });

  it('cuts three or more events into one badge, with a part per event', () => {
    for (const n of [3, 4, 5, 8]) {
      const [stack] = stackPoints(many(n));
      expect(stack!.cells).toHaveLength(1);
      expect(stack!.cells[0]!.members).toEqual(Array.from({ length: n }, (_, i) => i));
      expect(stack!.cells[0]!.more).toBeUndefined();
    }
  });

  it('ends a badge of more than eight events with a count part', () => {
    const [stack] = stackPoints(many(MAX_PARTS + 4));
    const cell = stack!.cells[0]!;
    expect(cell.members).toHaveLength(MAX_PARTS - 1);
    expect(cell.more).toBe(5);
  });

  it('merges neighbouring groups whose drawings would overlap', () => {
    const stacks = stackPoints([...many(2, 0), ...many(2, GROUP_PX + 3, 10)]);
    expect(stacks).toHaveLength(1);
    expect(stacks[0]!.cells[0]!.members).toHaveLength(4);
    expect(stackPoints([...many(2, 0), ...many(2, 400, 10)])).toHaveLength(2);
    expect(badgePx(5)).toBeGreaterThan(badgePx(4));
  });

  it('places a group at the mean of its points', () => {
    const [stack] = stackPoints([pt(0, 0, 'a', 0), pt(10, 20, 'b', 1)]);
    expect(stack).toMatchObject({ x: 5, y: 10 });
  });

  it('finds the part under a point for halves, thirds, quarters and more', () => {
    expect(sectorAt(2, -10, 0)).toBe(0);
    expect(sectorAt(2, 10, 0)).toBe(1);
    expect(sectorAt(3, 10, -5)).toBe(0);
    expect(sectorAt(3, 0, 10)).toBe(1);
    expect(sectorAt(3, -10, -5)).toBe(2);
    expect(sectorAt(4, -5, -5)).toBe(0);
    expect(sectorAt(4, 5, -5)).toBe(1);
    expect(sectorAt(4, 5, 5)).toBe(2);
    expect(sectorAt(4, -5, 5)).toBe(3);
    // Five or more start at the top and run clockwise.
    expect(sectorAt(6, 1, -10)).toBe(0);
    expect(sectorAt(6, -1, -10)).toBe(5);
    expect(sectorAt(8, 10, 0)).toBe(2);
  });

  it('handles no points', () => {
    expect(stackPoints([])).toEqual([]);
  });
});
