export interface StackPoint {
  x: number;
  y: number;
  // Points with the same key are one event, shown once per group.
  key: string;
  index: number;
}

export interface StackCell {
  // Index of the source point, or null for a count-only cell.
  index: number | null;
  dx: number;
  dy: number;
  // A round badge cut into parts, one per event, in part order: the source point of each part.
  members?: number[];
  // Events that did not fit: the badge ends with one extra part saying how many.
  more?: number;
}

export interface Stack {
  x: number;
  y: number;
  cells: StackCell[];
}

export const CELL_PX = 26;
export const GROUP_PX = 30;
// Up to this many events are shown as separate icons side by side; more become one badge cut into parts.
export const SPLIT_MIN = 3;
export const MAX_PARTS = 8;

export function badgePx(parts: number): number {
  return parts <= 4 ? 46 : 58;
}

// Where part 0 starts, in degrees clockwise from the top: halves, a Mercedes-style three-way split with a
// line pointing up, quarters (top-left first), and from five up the first part starts at the top.
export function sectorStart(n: number): number {
  return n === 2 ? 180 : n === 4 ? 270 : 0;
}

// Which part of an n-way badge lies at an offset from its center (dy grows downward).
export function sectorAt(n: number, dx: number, dy: number): number {
  const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  const rel = (deg - sectorStart(n) + 360) % 360;
  return Math.min(n - 1, Math.floor(rel / (360 / n)));
}

interface Group {
  x: number;
  y: number;
  pts: StackPoint[];
}

const uniqueByKey = (pts: readonly StackPoint[]): StackPoint[] => {
  const seen = new Set<string>();
  return pts.filter((p) => !seen.has(p.key) && !!seen.add(p.key));
};

// Parts of the badge for a group: its events, plus one for the count when more than MAX_PARTS.
export function partsFor(unique: number): number {
  return Math.min(unique, MAX_PARTS);
}

function size(g: Group): { w: number; h: number } {
  const unique = uniqueByKey(g.pts).length;
  if (unique >= SPLIT_MIN) return { w: badgePx(partsFor(unique)), h: badgePx(partsFor(unique)) };
  return { w: unique * CELL_PX, h: CELL_PX };
}

const center = (pts: readonly StackPoint[]) => ({
  x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
  y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
});

const overlap = (a: Group, b: Group): boolean => {
  const sa = size(a);
  const sb = size(b);
  return Math.abs(a.x - b.x) < (sa.w + sb.w) / 2 && Math.abs(a.y - b.y) < (sa.h + sb.h) / 2;
};

// Groups map icons that sit close together on screen. One or two events stay separate icons (side by side);
// three or more become a single round badge cut into one part per event (the last part is a "+N" count
// when there are more than MAX_PARTS). Groups whose drawings would overlap are merged.
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
    if (unique.length >= SPLIT_MIN) {
      const hidden = unique.length > MAX_PARTS ? unique.length - (MAX_PARTS - 1) : 0;
      const members = (hidden ? unique.slice(0, MAX_PARTS - 1) : unique).map((p) => p.index);
      return { x: g.x, y: g.y, cells: [{ index: members[0]!, dx: 0, dy: 0, members, ...(hidden ? { more: hidden } : {}) }] };
    }
    const cells = unique.map((p, i) => ({ index: p.index, dx: (i - (unique.length - 1) / 2) * CELL_PX, dy: 0 }));
    return { x: g.x, y: g.y, cells };
  });
}
