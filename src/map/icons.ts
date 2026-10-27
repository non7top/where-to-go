import type { IconName } from '../data/types';
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
