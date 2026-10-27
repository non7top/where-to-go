import { COLOR_STOPS } from '../lib/color';
import { RAIN_LABELS } from '../lib/rain';
import { rainTile } from '../map/patterns';

const MIN = COLOR_STOPS[0]![0];
const MAX = COLOR_STOPS[COLOR_STOPS.length - 1]![0];
const pct = (t: number) => ((t - MIN) / (MAX - MIN)) * 100;

export function renderLegend(el: HTMLElement) {
  const gradient = COLOR_STOPS.map(([t, hex]) => `${hex} ${pct(t).toFixed(1)}%`).join(', ');
  const ticks = [10, 17, 23, 30].map((t) => `<span style="left:${pct(t).toFixed(1)}%">${t}</span>`).join('');
  const rain = (kind: 'moderate' | 'heavy', label: string) =>
    `<div><span class="swatch-rain" style="background-image:url(${rainTile(kind).toDataURL()})"></span>${label}</div>`;
  el.innerHTML = `
    <h2>Typical daytime high (&deg;C)</h2>
    <div class="legend-bar" style="background:linear-gradient(to right, ${gradient})"></div>
    <div class="legend-ticks">${ticks}</div>
    <div class="legend-rain">${rain('moderate', RAIN_LABELS[2])}${rain('heavy', RAIN_LABELS[3])}</div>`;
}
