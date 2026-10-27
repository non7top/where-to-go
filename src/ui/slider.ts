import { MONTH_NAMES, MONTH_SHORT } from '../lib/months';

export interface MonthBar {
  set(month: number): void;
}

export function createMonthBar(el: HTMLElement, initial: number, onChange: (month: number) => void): MonthBar {
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-label', 'Month');
  el.setAttribute('aria-valuemin', '1');
  el.setAttribute('aria-valuemax', '12');
  el.tabIndex = 0;
  el.innerHTML = MONTH_SHORT.map((m, i) => `<div class="month-seg" data-m="${i + 1}">${m}</div>`).join('');
  const segs = [...el.querySelectorAll<HTMLElement>('.month-seg')];
  let value = initial;

  const render = () => {
    segs.forEach((s, i) => s.classList.toggle('active', i + 1 === value));
    el.setAttribute('aria-valuenow', String(value));
    el.setAttribute('aria-valuetext', MONTH_NAMES[value - 1]!);
  };
  const set = (m: number, emit = true) => {
    const next = Math.min(12, Math.max(1, m));
    if (next === value) return;
    value = next;
    render();
    if (emit) onChange(value);
  };
  const fromPointer = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const vertical = getComputedStyle(el).flexDirection === 'column';
    const f = vertical ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
    set(Math.floor(Math.min(0.999, Math.max(0, f)) * 12) + 1);
  };

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    fromPointer(e);
  });
  el.addEventListener('pointermove', (e) => {
    if (el.hasPointerCapture(e.pointerId)) fromPointer(e);
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
