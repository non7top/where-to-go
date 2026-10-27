import type { IconName } from '../data/types';
import { sectorStart } from '../lib/stack';
import { canvas } from './patterns';

type Ctx = CanvasRenderingContext2D;

// Every glyph is drawn in a 24 x 24 box and scaled into a white disc, so the icons read on any map color.
interface Icon {
  color: string;
  draw: (ctx: Ctx, color: string) => void;
}

function polygon(ctx: Ctx, pts: readonly (readonly [number, number])[]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

const MAPLE_RIGHT: [number, number][] = [
  [12, 1.5], [13.6, 5.2], [15.6, 4.4], [15.2, 8.2], [19.6, 6.8], [18.2, 11.2], [22, 12.4],
  [17.4, 14.6], [18.2, 17.4], [13.4, 16.4], [12.7, 22.5],
];
const MAPLE: [number, number][] = [
  ...MAPLE_RIGHT,
  ...MAPLE_RIGHT.slice(1).reverse().map(([x, y]): [number, number] => [24 - x, y]),
];

const star = (ctx: Ctx, cx: number, cy: number, outer: number, inner: number) => {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
};

export const ICONS: Record<IconName, Icon> = {
  maple: {
    color: '#d6402a',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 1.4;
      polygon(ctx, MAPLE);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      line(ctx, 12, 21, 12, 6);
      line(ctx, 12, 14.5, 18.5, 9);
      line(ctx, 12, 14.5, 5.5, 9);
      line(ctx, 12, 16.5, 17.2, 15.4);
      line(ctx, 12, 16.5, 6.8, 15.4);
    },
  },
  ginkgo: {
    color: '#d9a400',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.2;
      const leaf = new Path2D('M12 17.5C5.5 16.5 2.2 10.5 3 5.2C6 3.6 9.2 4.4 11 6.6L12 8.6L13 6.6C14.8 4.4 18 3.6 21 5.2C21.8 10.5 18.5 16.5 12 17.5Z');
      ctx.fill(leaf);
      ctx.stroke(leaf);
      ctx.lineWidth = 1.8;
      line(ctx, 12, 17.5, 12, 22.5);
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 0.9;
      line(ctx, 12, 16.8, 6.2, 7.4);
      line(ctx, 12, 16.8, 17.8, 7.4);
      line(ctx, 12, 16.8, 12, 11);
    },
  },
  sakura: {
    color: '#e8618c',
    draw(ctx, c) {
      ctx.fillStyle = c;
      for (let k = 0; k < 5; k++) {
        ctx.save();
        ctx.translate(12, 12);
        ctx.rotate((k * 2 * Math.PI) / 5);
        ctx.beginPath();
        ctx.ellipse(0, -5.6, 3.7, 5.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.arc(12, 12, 2.1, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  book: {
    color: '#2f6fd0',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.fill(new Path2D('M2.5 5.5C7 4.3 10.3 5 12 6.8C13.7 5 17 4.3 21.5 5.5V19C17 17.9 13.7 18.6 12 20.4C10.3 18.6 7 17.9 2.5 19Z'));
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      line(ctx, 12, 7.2, 12, 19.6);
      line(ctx, 4.8, 9, 9.6, 9.6);
      line(ctx, 4.8, 12, 9.6, 12.6);
      line(ctx, 14.4, 9.6, 19.2, 9);
      line(ctx, 14.4, 12.6, 19.2, 12);
    },
  },
  note: {
    color: '#1f78d1',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(7.2, 18.2, 3.2, 2.5, -0.35, 0, Math.PI * 2);
      ctx.ellipse(17, 16.2, 3.2, 2.5, -0.35, 0, Math.PI * 2);
      ctx.fill();
      line(ctx, 9.9, 17.6, 9.9, 5.6);
      line(ctx, 19.7, 15.6, 19.7, 3.6);
      polygon(ctx, [[9.9, 5.4], [19.7, 3.4], [19.7, 7], [9.9, 9]]);
      ctx.fill();
    },
  },
  drops: {
    color: '#1e9bd7',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.fill(new Path2D('M10 3C10 3 4 10 4 14.2A6 6 0 0 0 16 14.2C16 10 10 3 10 3Z'));
      ctx.globalAlpha = 0.75;
      ctx.fill(new Path2D('M18.5 9.5C18.5 9.5 15.5 13 15.5 15A3 3 0 0 0 21.5 15C21.5 13 18.5 9.5 18.5 9.5Z'));
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(10, 14.4, 3.4, Math.PI * 0.75, Math.PI * 1.1);
      ctx.stroke();
    },
  },
  lantern: {
    color: '#e8590c',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      line(ctx, 12, 1.8, 12, 3.6);
      ctx.fillRect(8.4, 3.4, 7.2, 2);
      ctx.beginPath();
      ctx.ellipse(12, 12.4, 6.4, 6.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(8.4, 18.6, 7.2, 2);
      line(ctx, 12, 20.4, 12, 23);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(12, 12.4, 3.2, 6.9, 0, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, 12, 5.6, 12, 19.2);
    },
  },
  boat: {
    color: '#0b7a8a',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      polygon(ctx, [[11, 3.4], [11, 13.4], [4.6, 13.4]]);
      ctx.fill();
      polygon(ctx, [[13, 5.6], [13, 13.4], [19.6, 13.4]]);
      ctx.fill();
      polygon(ctx, [[2.6, 15], [21.4, 15], [18.2, 20], [5.8, 20]]);
      ctx.fill();
      ctx.stroke();
    },
  },
  snow: {
    color: '#3f9fe0',
    draw(ctx, c) {
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.9;
      ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        ctx.save();
        ctx.translate(12, 12);
        ctx.rotate((k * Math.PI) / 3);
        line(ctx, 0, -9.4, 0, 9.4);
        line(ctx, 0, -6, -2.6, -8.6);
        line(ctx, 0, -6, 2.6, -8.6);
        line(ctx, 0, 6, -2.6, 8.6);
        line(ctx, 0, 6, 2.6, 8.6);
        ctx.restore();
      }
    },
  },
  monitor: {
    color: '#6741d9',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.roundRect(2.8, 4.2, 18.4, 12.6, 2);
      ctx.fill();
      line(ctx, 8, 20.4, 16, 20.4);
      line(ctx, 12, 17, 12, 20.4);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(5.2, 6.6, 13.6, 7.8);
      ctx.fillStyle = c;
      ctx.fillRect(7, 8.4, 4, 1.8);
      ctx.fillRect(7, 11.2, 7.5, 1.8);
    },
  },
  moon: {
    color: '#e0a100',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(12, 12, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      for (const [x, y, r] of [[9, 9, 2.2], [15, 13, 1.8], [10.5, 16, 1.4]] as const) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  grass: {
    color: '#a98a52',
    draw(ctx, c) {
      ctx.strokeStyle = c;
      ctx.fillStyle = '#f1e6c8';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      for (const [dx, tilt, top] of [[-4.6, -0.4, 6.5], [0, 0, 3.4], [4.6, 0.4, 6.5]] as const) {
        ctx.beginPath();
        ctx.moveTo(12 + dx * 0.4, 22);
        ctx.quadraticCurveTo(12 + dx * 0.8, 14, 12 + dx, top + 5);
        ctx.stroke();
        ctx.save();
        ctx.translate(12 + dx, top + 4);
        ctx.rotate(tilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.2, 5.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.restore();
      }
    },
  },
  calendar: {
    color: '#c47f00',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.roundRect(3.6, 5, 16.8, 15.6, 2.2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(3.6, 5, 16.8, 4.6);
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      line(ctx, 8, 3, 8, 6.6);
      line(ctx, 16, 3, 16, 6.6);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (const [x, y] of [[6.4, 12], [10.6, 12], [14.8, 12], [6.4, 16], [10.6, 16]] as const) ctx.fillRect(x, y, 2.8, 2.4);
    },
  },
  star: {
    color: '#d6336c',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 1.4;
      star(ctx, 12, 12.6, 10, 4.4);
      ctx.fill();
      ctx.stroke();
    },
  },
  booth: {
    color: '#7048e8',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 1.4;
      polygon(ctx, [[2.6, 10], [12, 3], [21.4, 10]]);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(4.8, 10, 14.4, 10.2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(10, 13.6, 4, 6.6);
      ctx.fillRect(6.2, 12.4, 2.6, 2.6);
      ctx.fillRect(15.2, 12.4, 2.6, 2.6);
    },
  },
  fireworks: {
    color: '#e8590c',
    draw(ctx, c) {
      ctx.strokeStyle = c;
      ctx.fillStyle = c;
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.8;
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        line(ctx, 12 + 3.6 * Math.cos(a), 11 + 3.6 * Math.sin(a), 12 + 9 * Math.cos(a), 11 + 9 * Math.sin(a));
        ctx.beginPath();
        ctx.arc(12 + 10.4 * Math.cos(a), 11 + 10.4 * Math.sin(a), 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(12, 11, 1.8, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  lily: {
    color: '#d6203c',
    draw(ctx, c) {
      ctx.strokeStyle = c;
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + ((k - 3) * Math.PI) / 5.2;
        ctx.beginPath();
        ctx.moveTo(12, 13);
        ctx.quadraticCurveTo(12 + 6 * Math.cos(a + 0.5), 13 + 6 * Math.sin(a + 0.5), 12 + 9.5 * Math.cos(a), 13 + 9.5 * Math.sin(a));
        ctx.stroke();
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(12 + 10 * Math.cos(a), 13 + 10 * Math.sin(a), 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#3d8b3d';
      ctx.lineWidth = 1.6;
      line(ctx, 12, 13, 12, 22);
    },
  },
  wisteria: {
    color: '#8a5cc8',
    draw(ctx, c) {
      ctx.fillStyle = c;
      for (const [x, n] of [[7, 4], [12, 5], [17, 4]] as const) {
        for (let i = 0; i < n; i++) {
          const w = 3.6 - i * 0.55;
          ctx.beginPath();
          ctx.ellipse(x + (i % 2 ? 0.8 : -0.8), 5 + i * 3.6, w, 1.9, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.strokeStyle = '#6b8e3a';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      line(ctx, 3, 3.4, 21, 3.4);
    },
  },
  hydrangea: {
    color: '#3f7fd8',
    draw(ctx, c) {
      for (const [x, y, col] of [[8.5, 9, c], [15.5, 9, '#7a6fd0'], [8.5, 16, '#7a6fd0'], [15.5, 16, c], [12, 12.5, '#5aa0e6']] as const) {
        ctx.fillStyle = col;
        for (let k = 0; k < 4; k++) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((k * Math.PI) / 2);
          ctx.beginPath();
          ctx.ellipse(0, -2.3, 1.7, 2.3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    },
  },
  lavender: {
    color: '#9060c0',
    draw(ctx, c) {
      ctx.strokeStyle = '#5f8f3a';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.fillStyle = c;
      for (const [x, tilt] of [[7, -2], [12, 0], [17, 2]] as const) {
        line(ctx, x - tilt * 0.8, 22, x, 8);
        for (let i = 0; i < 5; i++) {
          const y = 3 + i * 2.6;
          ctx.beginPath();
          ctx.ellipse(x - 1.1 + tilt * 0.1, y, 1.2, 1.7, 0, 0, Math.PI * 2);
          ctx.ellipse(x + 1.1 + tilt * 0.1, y + 1.2, 1.2, 1.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },
  sunflower: {
    color: '#e8a100',
    draw(ctx, c) {
      ctx.fillStyle = c;
      for (let k = 0; k < 12; k++) {
        ctx.save();
        ctx.translate(12, 12);
        ctx.rotate((k * Math.PI) / 6);
        ctx.beginPath();
        ctx.ellipse(0, -7, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#6b4423';
      ctx.beginPath();
      ctx.arc(12, 12, 4.6, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  plum: {
    color: '#c2255c',
    draw(ctx, c) {
      ctx.fillStyle = c;
      for (let k = 0; k < 5; k++) {
        ctx.save();
        ctx.translate(12, 12);
        ctx.rotate((k * 2 * Math.PI) / 5);
        ctx.beginPath();
        ctx.arc(0, -5.6, 4.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#7a1f3d';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const a = (k * 2 * Math.PI) / 5;
        line(ctx, 12, 12, 12 + 3.2 * Math.sin(a), 12 - 3.2 * Math.cos(a));
      }
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.arc(12, 12, 1.5, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  cosmos: {
    color: '#e0509a',
    draw(ctx, c) {
      ctx.fillStyle = c;
      for (let k = 0; k < 8; k++) {
        ctx.save();
        ctx.translate(12, 12);
        ctx.rotate((k * Math.PI) / 4);
        polygon(ctx, [[0, -2], [-3.2, -9.4], [0, -8.4], [3.2, -9.4]]);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#f2b705';
      ctx.beginPath();
      ctx.arc(12, 12, 2.6, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  firefly: {
    color: '#7fa800',
    draw(ctx, c) {
      const glow = ctx.createRadialGradient(12, 13, 1, 12, 13, 11);
      glow.addColorStop(0, 'rgba(210,235,60,0.95)');
      glow.addColorStop(1, 'rgba(210,235,60,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(12, 13, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(12, 14, 3.1, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3b3b1f';
      ctx.beginPath();
      ctx.ellipse(12, 9.2, 2.2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b3b1f';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      line(ctx, 11, 7.6, 9, 5);
      line(ctx, 13, 7.6, 15, 5);
    },
  },
  whale: {
    color: '#1c7ed6',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(2.5, 14);
      ctx.bezierCurveTo(3, 8.5, 9, 7, 14, 9.5);
      ctx.bezierCurveTo(17, 11, 19.5, 9, 21.5, 6);
      ctx.bezierCurveTo(21.8, 10, 20.5, 13, 18, 14.6);
      ctx.bezierCurveTo(14, 19, 6, 19, 2.5, 14);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(7, 12.2, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      line(ctx, 8.6, 7.6, 8.6, 4.4);
      line(ctx, 8.6, 4.4, 6.8, 3.2);
      line(ctx, 8.6, 4.4, 10.4, 3.2);
    },
  },
  sun: {
    color: '#f08c00',
    draw(ctx, c) {
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(12, 15, 5.4, Math.PI, 0);
      ctx.fill();
      for (let k = 0; k < 7; k++) {
        const a = Math.PI + (k * Math.PI) / 6;
        line(ctx, 12 + 7.8 * Math.cos(a), 15 + 7.8 * Math.sin(a), 12 + 10.6 * Math.cos(a), 15 + 10.6 * Math.sin(a));
      }
      line(ctx, 2.5, 18, 21.5, 18);
      line(ctx, 6, 21, 18, 21);
    },
  },
};

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

// White disc with a colored ring, so the glyph stands out on every temperature color.
export function eventIcon(name: IconName): ImageData {
  const { color, draw } = ICONS[name];
  const [, ctx] = canvas(48, 48);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.arc(24, 25, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(24, 24, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  ctx.translate(24, 24.5);
  ctx.scale(1.18, 1.18);
  ctx.translate(-12, -12);
  draw(ctx, color);
  ctx.restore();
  return ctx.getImageData(0, 0, 48, 48);
}

const urls = new Map<IconName, string>();

// The bare glyph as a small image, for lists and cards.
export function iconDataUrl(name: IconName): string {
  let url = urls.get(name);
  if (!url) {
    const [c, ctx] = canvas(48, 48);
    ctx.translate(24, 24);
    ctx.scale(1.8, 1.8);
    ctx.translate(-12, -12);
    ICONS[name].draw(ctx, ICONS[name].color);
    url = c.toDataURL();
    urls.set(name, url);
  }
  return url;
}

const hexAlpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// A round badge cut into parts, one per event: halves would be two, then a Mercedes-style three, quarters, and
// on up to eight. With `more` events that did not fit, the last part is a "+N" count.
export function comboIcon(names: readonly IconName[], more = 0): ImageData {
  const parts = names.length + (more ? 1 : 0);
  const S = parts <= 4 ? 84 : 108;
  const C = S / 2;
  const R = C - 3;
  const [, ctx] = canvas(S, S);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.arc(C, C + 1.5, R + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(C, C, R, 0, Math.PI * 2);
  ctx.fill();

  const start = sectorStart(parts);
  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const color = (i: number) => (i < names.length ? ICONS[names[i]!].color : '#6b7785');
  for (let i = 0; i < parts; i++) {
    const a0 = start + (i * 360) / parts;
    ctx.fillStyle = hexAlpha(color(i), 0.2);
    ctx.beginPath();
    ctx.moveTo(C, C);
    ctx.arc(C, C, R, rad(a0), rad(a0 + 360 / parts));
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#2b3440';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < parts; i++) {
    const a = rad(start + (i * 360) / parts);
    ctx.beginPath();
    ctx.moveTo(C, C);
    ctx.lineTo(C + R * Math.cos(a), C + R * Math.sin(a));
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(C, C, R, 0, Math.PI * 2);
  ctx.stroke();

  // Each glyph sits at the middle of its part, as large as the part allows.
  const reach = R * 0.58;
  const chord = 2 * reach * Math.sin(Math.PI / parts);
  const scale = Math.min(1.3, Math.max(0.5, (chord * 0.8) / 24));
  for (let i = 0; i < parts; i++) {
    const mid = rad(start + ((i + 0.5) * 360) / parts);
    const x = C + reach * Math.cos(mid);
    const y = C + reach * Math.sin(mid);
    if (i >= names.length) {
      ctx.fillStyle = '#2b3440';
      ctx.font = `700 ${Math.round(14 * scale + 8)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${more}`, x, y);
      continue;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-12, -12);
    ICONS[names[i]!].draw(ctx, ICONS[names[i]!].color);
    ctx.restore();
  }
  return ctx.getImageData(0, 0, S, S);
}
