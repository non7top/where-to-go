import { describe, expect, it } from 'vitest';
import { CELL_PX, GROUP_PX, MAX_CELLS, stackPoints } from '../src/lib/stack';
import type { StackPoint } from '../src/lib/stack';

const pt = (x: number, y: number, key: string, index: number): StackPoint => ({ x, y, key, index });

describe('stackPoints', () => {
  it('keeps far apart points in separate groups', () => {
    const stacks = stackPoints([pt(0, 0, 'a', 0), pt(GROUP_PX + 5, 0, 'b', 1)]);
    expect(stacks).toHaveLength(2);
    expect(stacks[0]!.cells).toEqual([{ index: 0, dx: 0, dy: 0 }]);
  });

  it('lays a group out four to a row, centered, then a second row', () => {
    const stacks = stackPoints(Array.from({ length: 5 }, (_, i) => pt(i, 0, `e${i}`, i)));
    expect(stacks).toHaveLength(1);
    const cells = stacks[0]!.cells;
    expect(cells.map((c) => [c.dx, c.dy])).toEqual([
      [-1.5 * CELL_PX, -CELL_PX / 2],
      [-0.5 * CELL_PX, -CELL_PX / 2],
      [0.5 * CELL_PX, -CELL_PX / 2],
      [1.5 * CELL_PX, -CELL_PX / 2],
      [0, CELL_PX / 2],
    ]);
  });

  it('shows one icon per event in a group', () => {
    const stacks = stackPoints([pt(0, 0, 'maple', 0), pt(2, 1, 'maple', 1), pt(3, 0, 'ginkgo', 2)]);
    expect(stacks[0]!.cells.map((c) => c.index)).toEqual([0, 2]);
  });

  it('ends a big group with a "more" cell that counts the hidden events', () => {
    const many = Array.from({ length: MAX_CELLS + 4 }, (_, i) => pt(i % 3, 0, `e${i}`, i));
    const cells = stackPoints(many)[0]!.cells;
    expect(cells).toHaveLength(MAX_CELLS);
    expect(cells[MAX_CELLS - 1]).toMatchObject({ index: null, more: 5 });
    expect(cells.filter((c) => c.index !== null)).toHaveLength(MAX_CELLS - 1);
  });

  it('places a group at the mean of its points', () => {
    const [stack] = stackPoints([pt(0, 0, 'a', 0), pt(10, 20, 'b', 1)]);
    expect(stack).toMatchObject({ x: 5, y: 10 });
  });

  it('merges neighbouring groups whose grids would overlap, so the grids never cover each other', () => {
    const left = Array.from({ length: 4 }, (_, i) => pt(0, 0, `l${i}`, i));
    const right = Array.from({ length: 4 }, (_, i) => pt(GROUP_PX + 8, 0, `r${i}`, 10 + i));
    const stacks = stackPoints([...left, ...right]);
    expect(stacks).toHaveLength(1);
    expect(stacks[0]!.cells).toHaveLength(MAX_CELLS);
    const apart = stackPoints([...left, ...right.map((p) => ({ ...p, x: 400 }))]);
    expect(apart).toHaveLength(2);
  });

  it('handles no points', () => {
    expect(stackPoints([])).toEqual([]);
  });
});
