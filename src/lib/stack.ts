export interface StackPoint {
  x: number;
  y: number;
  // Points with the same key are one event, shown once per group.
  key: string;
  index: number;
}

export interface StackCell {
  // Index of the source point, or null for the "more" cell.
  index: number | null;
  dx: number;
  dy: number;
  more?: number;
}

export interface Stack {
  x: number;
  y: number;
  cells: StackCell[];
}

export const CELL_PX = 26;
export const PER_ROW = 4;
export const MAX_CELLS = 8;
export const GROUP_PX = 30;

interface Group {
  x: number;
  y: number;
  pts: StackPoint[];
}

const uniqueByKey = (pts: readonly StackPoint[]): StackPoint[] => {
  const seen = new Set<string>();
  return pts.filter((p) => !seen.has(p.key) && !!seen.add(p.key));
};

// Size of a group's grid in pixels: its distinct events, at most MAX_CELLS cells, four to a row.
function gridSize(g: Group): { w: number; h: number } {
  const cells = Math.min(MAX_CELLS, uniqueByKey(g.pts).length);
  return { w: Math.min(PER_ROW, cells) * CELL_PX, h: Math.ceil(cells / PER_ROW) * CELL_PX };
}

const center = (pts: readonly StackPoint[]) => ({
  x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
  y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
});

const overlap = (a: Group, b: Group): boolean => {
  const sa = gridSize(a);
  const sb = gridSize(b);
  return Math.abs(a.x - b.x) < (sa.w + sb.w) / 2 && Math.abs(a.y - b.y) < (sa.h + sb.h) / 2;
};

// Groups map icons that sit close together on screen and lays each group out as a small grid,
// four to a row, centered on the group. One icon per event; a big group ends in a "more" cell.
// Groups whose grids would overlap are merged, so the grids never cover each other.
export function stackPoints(points: readonly StackPoint[]): Stack[] {
  const groups: Group[] = [];
  for (const p of points) {
    const g = groups.find((q) => Math.hypot(q.x - p.x, q.y - p.y) <= GROUP_PX);
    if (g) g.pts.push(p);
    else groups.push({ x: p.x, y: p.y, pts: [p] });
  }
  for (const g of groups) Object.assign(g, center(g.pts));
  for (let again = true; again; ) {
    again = false;
    for (let i = 0; i < groups.length && !again; i++) {
      for (let j = i + 1; j < groups.length && !again; j++) {
        if (!overlap(groups[i]!, groups[j]!)) continue;
        groups[i]!.pts.push(...groups[j]!.pts);
        Object.assign(groups[i]!, center(groups[i]!.pts));
        groups.splice(j, 1);
        again = true;
      }
    }
  }
  return groups.map((g) => {
    const unique = uniqueByKey(g.pts);
    const hidden = unique.length > MAX_CELLS ? unique.length - (MAX_CELLS - 1) : 0;
    const shown = hidden ? unique.slice(0, MAX_CELLS - 1) : unique;
    const total = shown.length + (hidden ? 1 : 0);
    const rows = Math.ceil(total / PER_ROW);
    const items: { index: number | null; more?: number }[] = shown.map((p) => ({ index: p.index }));
    if (hidden) items.push({ index: null, more: hidden });
    const cells = items.map((item, i) => {
      const row = Math.floor(i / PER_ROW);
      const inRow = row === rows - 1 ? total - row * PER_ROW : PER_ROW;
      return { ...item, dx: ((i % PER_ROW) - (inRow - 1) / 2) * CELL_PX, dy: (row - (rows - 1) / 2) * CELL_PX };
    });
    return { x: g.x, y: g.y, cells };
  });
}
