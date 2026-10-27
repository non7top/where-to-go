import { BAND_STEP } from '../lib/color';
import { drumScale, drumX, dayAtX, offsetFrom, onFront, RAD_PER_DAY, VISIBLE_DAYS } from '../lib/dial';
import { MONTH_SHORT } from '../lib/months';
import { HALF_WINDOW, MID_DAY, MONTH_START, sectionLabel, seasonOf, SEASONS, wrapDay, YEAR_DAYS } from '../lib/season';

export interface Dial {
  set(day: number): void;
  setBand(colors: readonly string[] | null, areaName: string): void;
}

const H = 98;
const TAP_PX = 4;
const f = (n: number) => n.toFixed(1);

// A year drum seen from the side: the front half of a cylinder with the selected 15-day section in the
// middle. Dates farther from the center are squeezed and fade as the surface turns away. Time is
// continuous, so dragging, the wheel and the arrow keys all scroll smoothly.
export function createDial(
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
  let tint: readonly string[] | null = null;
  let areaName = '';

  const render = () => {
    const W = el.clientWidth || 640;
    const R = W / 2 - 4;
    const cx = W / 2;
    const x = (offset: number) => cx + drumX(offset, R);

    const marks: string[] = [];
    const labels: string[] = [];
    for (const lap of [-1, 0, 1]) {
      MONTH_START.forEach((start, m) => {
        const offset = start + lap * YEAR_DAYS - value;
        if (onFront(offset)) {
          marks.push(`<line class="dial-tick major" x1="${f(x(offset))}" x2="${f(x(offset))}" y1="52" y2="68"/>`);
        }
        const mid = MID_DAY[m]! + lap * YEAR_DAYS - value;
        if (onFront(mid)) {
          const s = drumScale(mid);
          labels.push(
            `<text class="dial-t" transform="translate(${f(x(mid))} 40) scale(${s.toFixed(3)} 1)" opacity="${Math.pow(s, 1.4).toFixed(2)}">${MONTH_SHORT[m]}</text>`,
          );
        }
      });
    }
    // The strip under the months is the year's felt temperature for the area at the map center.
    const bands: string[] = [];
    const steps = Math.ceil(YEAR_DAYS / BAND_STEP);
    for (let lap = -1; lap <= 1; lap++) {
      for (let i = 0; i < steps; i++) {
        const a = i * BAND_STEP + lap * YEAR_DAYS - value;
        const lo = Math.max(-VISIBLE_DAYS, a);
        const hi = Math.min(VISIBLE_DAYS, a + BAND_STEP);
        if (hi <= lo) continue;
        bands.push(`<rect x="${f(x(lo))}" y="82" width="${(x(hi) - x(lo) + 0.6).toFixed(1)}" height="13" fill="${tint?.[i] ?? '#9aa0a6'}"/>`);
      }
    }
    for (const lap of [-1, 0, 1]) {
      for (const s of SEASONS) {
        const a = Math.max(-VISIBLE_DAYS, s.start + lap * YEAR_DAYS - value);
        const b = Math.min(VISIBLE_DAYS, s.start + s.len + lap * YEAR_DAYS - value);
        if (b <= a) continue;
        if (s.start + lap * YEAR_DAYS - value > -VISIBLE_DAYS) {
          bands.push(`<line class="dial-tick major" x1="${f(x(a))}" x2="${f(x(a))}" y1="82" y2="95"/>`);
        }
        if (b - a > 25) {
          const mid = (a + b) / 2;
          bands.push(`<text class="dial-season" transform="translate(${f(x(mid))} 89) scale(${drumScale(mid).toFixed(3)} 1)">${s.name}</text>`);
        }
      }
    }
    const first = Math.ceil((value - VISIBLE_DAYS) / 5) * 5;
    for (let d = first; d < value + VISIBLE_DAYS; d += 5) {
      const offset = d - value;
      const isMonthStart = MONTH_START.includes(wrapDay(d));
      if (isMonthStart) continue;
      marks.push(`<line class="dial-tick" x1="${f(x(offset))}" x2="${f(x(offset))}" y1="52" y2="${f(58 + 4 * drumScale(offset))}" opacity="${drumScale(offset).toFixed(2)}"/>`);
    }

    // Tint along the surface from today forward to the selection; it may run off one edge and in from the other.
    const span = wrapDay(value - todayDay);
    const rel = offsetFrom(value, todayDay);
    let band = '';
    if (span > 0.5) {
      const left = span >= VISIBLE_DAYS ? cx - R : x(-span);
      band += `<rect class="dial-range" x="${f(left)}" y="72" width="${f(cx - left)}" height="5" rx="2.5"/>`;
      if (rel > 0 && rel < VISIBLE_DAYS) band += `<rect class="dial-range" x="${f(x(rel))}" y="72" width="${f(cx + R - x(rel))}" height="5" rx="2.5"/>`;
    }
    const todayMark = onFront(rel) ? `<path class="dial-today" d="M${f(x(rel) - 4.5)} 69 L${f(x(rel) + 4.5)} 69 L${f(x(rel))} 76 Z"/>` : '';
    const halfFrame = drumX(HALF_WINDOW + 0.5, R);

    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
      <defs><linearGradient id="dial-shade" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0.34"/><stop offset="0.24" stop-color="#000" stop-opacity="0"/>
        <stop offset="0.76" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.34"/>
      </linearGradient></defs>
      <rect class="dial-bg" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14"/>
      ${bands.join('')}${band}${marks.join('')}${labels.join('')}${todayMark}
      <rect class="dial-sel" x="${f(cx - halfFrame)}" y="24" width="${f(halfFrame * 2)}" height="48" rx="7"/>
      <rect class="dial-shade" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="url(#dial-shade)"/>
      <text class="dial-area" x="14" y="16">${areaName}</text>
      <text class="dial-label" x="${cx}" y="16">${sectionLabel(value)} <tspan class="dial-eta">${seasonOf(value).name}, ${etaOf(value)}</tspan></text>
    </svg>`;
    el.setAttribute('aria-valuenow', String(Math.round(value)));
    el.setAttribute('aria-valuetext', `${sectionLabel(value)}, ${seasonOf(value).name}, ${etaOf(value)}`);
  };

  const set = (day: number, emit = true) => {
    value = wrapDay(day);
    render();
    if (emit) onChange(value);
  };

  const animateTo = (target: number) => {
    cancelAnimationFrame(raf);
    const from = value;
    const diff = offsetFrom(from, target);
    const start = performance.now();
    const duration = Math.min(700, 220 + Math.abs(diff) * 3);
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      set(from + diff * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  const radius = () => el.clientWidth / 2 - 4;
  const fromCenter = (clientX: number) => clientX - (el.getBoundingClientRect().left + el.clientWidth / 2);
  let drag: { x0: number; v0: number; moved: boolean } | null = null;

  el.addEventListener('pointerdown', (e) => {
    cancelAnimationFrame(raf);
    el.setPointerCapture(e.pointerId);
    drag = { x0: e.clientX, v0: value, moved: false };
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    if (Math.abs(dx) > TAP_PX) drag.moved = true;
    // Near the center the surface moves 1:1 with the finger: a pixel is 1/R radians.
    if (drag.moved) set(drag.v0 - dx / radius() / RAD_PER_DAY);
  });
  el.addEventListener('pointerup', (e) => {
    if (drag && !drag.moved) animateTo(value + dayAtX(fromCenter(e.clientX), radius()));
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
  new ResizeObserver(() => render()).observe(el);

  render();
  return {
    set: (day) => set(day, false),
    setBand: (colors, name) => {
      tint = colors;
      areaName = name;
      render();
    },
  };
}
