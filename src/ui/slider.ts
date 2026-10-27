import { MONTH_NAMES, MONTH_SHORT, wrapMonth } from '../lib/months';
import { monthsAhead } from '../lib/timeuntil';

export interface MonthBar {
  set(month: number): void;
}

const CENTER = 6;
const DRAG_PX = 4;

// A ring of 12 months with the selected one always in the middle. The stretch from today's month
// forward to the selected month is tinted; when it runs past the edge it continues from the other side.
export function createMonthBar(
  el: HTMLElement,
  initial: number,
  todayMonth: number,
  onChange: (month: number) => void,
): MonthBar {
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-label', 'Month');
  el.setAttribute('aria-valuemin', '1');
  el.setAttribute('aria-valuemax', '12');
  el.tabIndex = 0;
  let value = initial;

  const render = () => {
    const span = monthsAhead(todayMonth, value);
    el.innerHTML = Array.from({ length: 12 }, (_, k) => {
      const m = wrapMonth(value - CENTER + k);
      const cls = ['month-seg'];
      if (k === CENTER) cls.push('active');
      if (m === todayMonth) cls.push('today');
      if (monthsAhead(todayMonth, m) <= span) cls.push('in-range');
      return `<div class="${cls.join(' ')}" data-m="${m}">${MONTH_SHORT[m - 1]}</div>`;
    }).join('');
    el.setAttribute('aria-valuenow', String(value));
    el.setAttribute('aria-valuetext', MONTH_NAMES[value - 1]!);
  };
  const set = (m: number, emit = true) => {
    const next = wrapMonth(m);
    if (next === value) return;
    value = next;
    render();
    if (emit) onChange(value);
  };

  const vertical = () => getComputedStyle(el).flexDirection === 'column';
  const pos = (e: PointerEvent) => (vertical() ? e.clientY : e.clientX);
  const cellSize = () => (vertical() ? el.clientHeight : el.clientWidth) / 12;
  let drag: { p0: number; v0: number; moved: boolean; target: number } | null = null;

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    const target = Number((e.target as HTMLElement).closest<HTMLElement>('[data-m]')?.dataset.m ?? 0);
    drag = { p0: pos(e), v0: value, moved: false, target };
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const delta = drag.p0 - pos(e);
    if (Math.abs(delta) > DRAG_PX) drag.moved = true;
    if (drag.moved) set(drag.v0 + Math.round(delta / cellSize()));
  });
  const end = () => {
    if (drag && !drag.moved && drag.target) set(drag.target);
    drag = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', () => {
    drag = null;
  });
  el.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: 3, PageDown: -3 }[e.key];
    if (step !== undefined) set(value + step);
    else if (e.key === 'Home') set(1);
    else if (e.key === 'End') set(12);
    else return;
    e.preventDefault();
  });

  render();
  return { set: (m) => set(m, false) };
}
