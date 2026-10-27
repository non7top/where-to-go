import { BAND_STEP } from '../lib/color';
import { degToDay, dayToDeg, pointerDeg, polar, sectorPath, turn } from '../lib/ring';
import { MONTH_SHORT } from '../lib/months';
import { HALF_WINDOW, MID_DAY, MONTH_START, sectionLabel, seasonOf, SEASONS, wrapDay, YEAR_DAYS } from '../lib/season';
import type { Dial } from './dial';

const C = 100;
const R_IN = 54;
const R_OUT = 84;
const RIM_IN = 86;
const RIM_OUT = 91;
const SEASON_IN = 92.5;
const SEASON_OUT = 96.5;
const R_LABEL = 69;
const MONTH_DAYS = MONTH_START.map((s, i) => (MONTH_START[i + 1] ?? YEAR_DAYS) - s);
const TAP_PX = 4;

const norm = (deg: number) => ((deg % 360) + 360) % 360;
const f = (n: number) => n.toFixed(1);

// A year ring seen from above that turns under a fixed pointer at the top. The 15-day section under the
// pointer is the selection; the rim is tinted from today forward to it, and the outer edge shows the seasons.
export function createRing(
  el: HTMLElement,
  initial: number,
  todayDay: number,
  onChange: (day: number) => void,
  etaOf: (day: number) => string,
): Dial {
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-label', 'Time of year, 15-day section');
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', String(YEAR_DAYS - 1));
  el.tabIndex = 0;
  let value = wrapDay(initial);
  let raf = 0;
  let band: readonly string[] | null = null;
  let areaName = '';

  const render = () => {
    const rel = (day: number) => norm(dayToDeg(day - value));
    const months = MONTH_START.map((start, m) => {
      const a0 = rel(start);
      return `<path class="dial-m ${m % 2 ? 'odd' : 'even'}" d="${sectorPath(C, C, R_IN, R_OUT, a0, a0 + dayToDeg(MONTH_DAYS[m]!))}"/>`;
    }).join('');
    const steps = Math.ceil(YEAR_DAYS / BAND_STEP);
    // The outer edge is the year's felt temperature for the area at the map center.
    const seasons = Array.from({ length: steps }, (_, i) => {
      const a0 = rel(i * BAND_STEP);
      return `<path d="${sectorPath(C, C, SEASON_IN, SEASON_OUT, a0, a0 + dayToDeg(BAND_STEP) + 0.4)}" fill="${band?.[i] ?? '#9aa0a6'}"/>`;
    }).join('') + SEASONS.map((s) => {
      const [x0, y0] = polar(C, C, SEASON_IN - 1, rel(s.start));
      const [x1, y1] = polar(C, C, SEASON_OUT + 1, rel(s.start));
      return `<line class="dial-tick major" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"/>`;
    }).join('');
    const labels = MID_DAY.map((mid, m) => {
      const [x, y] = polar(C, C, R_LABEL, rel(mid));
      return `<text class="dial-t" x="${f(x)}" y="${f(y)}">${MONTH_SHORT[m]}</text>`;
    }).join('');
    const span = wrapDay(value - todayDay);
    const t0 = rel(todayDay);
    const range = span > 0.5 ? `<path class="dial-range" d="${sectorPath(C, C, RIM_IN, RIM_OUT, t0, t0 + dayToDeg(span))}"/>` : '';
    const [tx, ty] = polar(C, C, (RIM_IN + RIM_OUT) / 2, t0);
    const half = dayToDeg(HALF_WINDOW + 0.5);
    const season = seasonOf(value);
    el.innerHTML = `<svg viewBox="0 0 200 200" aria-hidden="true">
      <circle class="dial-bg" cx="${C}" cy="${C}" r="98"/>
      ${months}${seasons}${range}${labels}
      <circle class="dial-today" cx="${f(tx)}" cy="${f(ty)}" r="3"/>
      <path class="dial-sel" d="${sectorPath(C, C, R_IN - 3, SEASON_OUT + 1, -half, half)}"/>
      <path class="dial-ptr" d="M94.5 0L105.5 0L100 6.5Z"/>
      <text class="dial-area" x="${C}" y="${C - 25}" text-anchor="middle">${areaName}</text>
      <text class="dial-label" x="${C}" y="${C - 10}">${sectionLabel(value)}</text>
      <text class="dial-season" x="${C}" y="${C + 4}">${season.name}</text>
      <text class="dial-eta" x="${C}" y="${C + 18}">${etaOf(value)}</text>
    </svg>`;
    el.setAttribute('aria-valuenow', String(Math.round(value)));
    el.setAttribute('aria-valuetext', `${sectionLabel(value)}, ${season.name}, ${etaOf(value)}`);
  };

  const set = (day: number, emit = true) => {
    value = wrapDay(day);
    render();
    if (emit) onChange(value);
  };

  const animateTo = (target: number) => {
    cancelAnimationFrame(raf);
    const from = value;
    const diff = ((((target - from + YEAR_DAYS / 2) % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS) - YEAR_DAYS / 2;
    const start = performance.now();
    const duration = Math.min(700, 220 + Math.abs(diff) * 3);
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      set(from + diff * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  const center = () => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2] as const;
  };
  let drag: { last: number; acc: number; v0: number; moved: boolean } | null = null;

  el.addEventListener('pointerdown', (e) => {
    cancelAnimationFrame(raf);
    el.setPointerCapture(e.pointerId);
    const [cx, cy] = center();
    drag = { last: pointerDeg(cx, cy, e.clientX, e.clientY), acc: 0, v0: value, moved: false };
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [cx, cy] = center();
    const a = pointerDeg(cx, cy, e.clientX, e.clientY);
    drag.acc += turn(drag.last, a);
    drag.last = a;
    if (Math.abs(drag.acc) * ((R_IN + R_OUT) / 2) * (Math.PI / 180) > TAP_PX) drag.moved = true;
    if (drag.moved) set(drag.v0 - degToDay(drag.acc));
  });
  el.addEventListener('pointerup', (e) => {
    if (drag && !drag.moved) {
      const [cx, cy] = center();
      animateTo(value + degToDay(pointerDeg(cx, cy, e.clientX, e.clientY)));
    }
    drag = null;
  });
  el.addEventListener('pointercancel', () => {
    drag = null;
  });
  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      set(value + (e.deltaY + e.deltaX) * 0.12);
    },
    { passive: false },
  );
  el.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 15, PageDown: -15 }[e.key];
    if (step !== undefined) set(value + step);
    else if (e.key === 'Home') animateTo(todayDay);
    else return;
    e.preventDefault();
  });

  render();
  return {
    set: (day) => set(day, false),
    setBand: (colors, name) => {
      band = colors;
      areaName = name;
      render();
    },
  };
}
