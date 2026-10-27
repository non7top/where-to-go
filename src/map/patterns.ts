import type { EventCategory } from '../data/types';

export const RAIN_PATTERNS = { moderate: 'rain-moderate', heavy: 'rain-heavy' } as const;

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  festival: '#d6336c',
  fair: '#7048e8',
  seasonal: '#0b8f7f',
  holiday: '#c47f00',
  concert: '#1971c2',
};

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

function diagonals(ctx: CanvasRenderingContext2D, s: number, flip: boolean) {
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.beginPath();
    ctx.moveTo(flip ? s - x0 : x0, y0);
    ctx.lineTo(flip ? s - x1 : x1, y1);
    ctx.stroke();
  };
  for (const [dx, dy] of [[0, 0], [-s, 0], [s, 0]] as const) line(dx, s + dy, dx + s, dy);
}

// Transparent tile with white diagonal lines over a faint dark line, readable on any area color.
export function rainTile(kind: keyof typeof RAIN_PATTERNS): HTMLCanvasElement {
  const size = kind === 'heavy' ? 20 : 28;
  const [c, ctx] = canvas(size, size);
  for (const [color, width] of [['rgba(10,25,50,0.35)', 4.5], ['rgba(255,255,255,0.92)', 2.5]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    diagonals(ctx, size, false);
    if (kind === 'heavy') diagonals(ctx, size, true);
  }
  return c;
}

export function tileImage(c: HTMLCanvasElement): ImageData {
  return c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
}

function glyph(ctx: CanvasRenderingContext2D, category: EventCategory, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (category) {
    case 'festival': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 12 : 5;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx.lineTo(24 + r * Math.cos(a), 25 + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'fair': {
      ctx.beginPath();
      ctx.moveTo(24, 12);
      ctx.lineTo(36, 24);
      ctx.lineTo(12, 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(14, 25, 20, 10);
      break;
    }
    case 'seasonal': {
      ctx.beginPath();
      ctx.ellipse(24, 24, 7, 13, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(17, 31);
      ctx.lineTo(31, 17);
      ctx.stroke();
      break;
    }
    case 'holiday': {
      ctx.lineWidth = 2.5;
      ctx.strokeRect(13, 15, 22, 19);
      ctx.fillRect(13, 15, 22, 6);
      ctx.fillRect(18, 25, 4, 4);
      ctx.fillRect(26, 25, 4, 4);
      break;
    }
    case 'concert': {
      ctx.beginPath();
      ctx.ellipse(19, 33, 5.5, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(23.5, 32);
      ctx.lineTo(23.5, 13);
      ctx.lineTo(32, 17);
      ctx.stroke();
      break;
    }
  }
}

export function starIcon(): ImageData {
  const [, ctx] = canvas(48, 48);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 20 : 8.5;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(24 + r * Math.cos(a), 25 + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = '#ffc83d';
  ctx.strokeStyle = '#7a4b00';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  return ctx.getImageData(0, 0, 48, 48);
}

export function clusterIcon(): ImageData {
  const [, ctx] = canvas(48, 48);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.arc(24, 25, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(24, 24, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b3440';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(15, 24);
  ctx.lineTo(33, 24);
  ctx.moveTo(24, 15);
  ctx.lineTo(24, 33);
  ctx.stroke();
  return ctx.getImageData(0, 0, 48, 48);
}

// White disc with a colored ring so the icon stands out on every temperature color.
export function eventIcon(category: EventCategory): ImageData {
  const [, ctx] = canvas(48, 48);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.arc(24, 25, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(24, 24, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = CATEGORY_COLORS[category];
  ctx.lineWidth = 3;
  ctx.stroke();
  glyph(ctx, category, CATEGORY_COLORS[category]);
  return ctx.getImageData(0, 0, 48, 48);
}
