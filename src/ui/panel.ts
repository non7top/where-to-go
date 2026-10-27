import type { AppData } from '../data/load';
import type { AreaProps, MapEvent } from '../data/types';
import { nightFlag } from '../lib/comfort';
import { comfortColor } from '../lib/color';
import { CATEGORY_LABELS, eventsForMonth } from '../lib/events';
import { MONTH_NAMES } from '../lib/months';
import { RAIN_LABELS } from '../lib/rain';
import { esc } from './esc';

const LEVEL_LABELS = { country: 'Country (average of its provinces)', province: 'Province or region', island: 'Island' };
const EQUIPMENT = { yes: 'typical', partial: 'sometimes available', no: 'not typical' };
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

type View = { kind: 'area'; id: string } | { kind: 'event'; event: MapEvent; backTo: string | null } | null;

export class Panel {
  private view: View = null;
  private props = new Map<string, AreaProps>();
  private eventAreas = new Map<string, Set<string>>();

  constructor(
    private el: HTMLElement,
    private data: AppData,
    private getMonth: () => number,
    private onChange: (areaId: string | null) => void,
    eventAreas: Map<string, Set<string>>,
  ) {
    for (const f of data.areas.features) this.props.set(f.properties.id, f.properties);
    this.eventAreas = eventAreas;
    el.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (!t) return;
      if (t.dataset.act === 'close') this.hide();
      else if (t.dataset.act === 'back' && t.dataset.id) this.showArea(t.dataset.id);
      else if (t.dataset.act === 'event') {
        const ev = data.events.find((x) => x.id === t.dataset.id);
        if (ev) this.showEvent(ev, this.view?.kind === 'area' ? this.view.id : null);
      }
    });
  }

  isOpen() {
    return this.view !== null;
  }

  showArea(id: string) {
    this.view = { kind: 'area', id };
    this.render();
    this.onChange(id);
  }

  showEvent(event: MapEvent, backTo: string | null = null) {
    this.view = { kind: 'event', event, backTo };
    this.render();
    this.onChange(null);
  }

  hide() {
    this.view = null;
    this.el.hidden = true;
    document.body.classList.remove('panel-open');
    this.onChange(null);
  }

  refresh() {
    if (this.view) this.render();
  }

  private open(html: string) {
    this.el.innerHTML = `<button class="close" type="button" data-act="close" aria-label="Close">&times;</button>${html}`;
    this.el.hidden = false;
    document.body.classList.add('panel-open');
    this.el.querySelector<HTMLElement>('h2')?.setAttribute('tabindex', '-1');
    this.el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }

  private render() {
    if (!this.view) return;
    if (this.view.kind === 'event') this.open(this.eventHtml(this.view.event, this.view.backTo));
    else this.open(this.areaHtml(this.view.id));
  }

  private areaHtml(id: string): string {
    const p = this.props.get(id);
    const c = this.data.climate[id];
    const month = this.getMonth();
    const i = month - 1;
    if (!p) return '<h2>Unknown area</h2>';
    const title = `<h2>${esc(p.name)}</h2><p class="sub">${esc(regionNames.of(p.country) ?? p.country)}, ${LEVEL_LABELS[p.level]}. ${MONTH_NAMES[i]}.</p>`;
    const hi = c?.hi[i] ?? null;
    const lo = c?.lo[i] ?? null;
    if (!c || hi === null) return `${title}<p>No climate data for this month.</p>`;

    const level = c.rainLevel[i] ?? 0;
    const tier = c.cost[i] ?? 2;
    const comfort = c.comfort?.[i] ?? null;
    const flag = nightFlag(lo, c.heating, c.cooling);
    const rows = [
      `<div class="row"><span class="temp-swatch" style="background:${comfortColor(hi)}"></span><div><b>${Math.round(hi)}&deg;C day</b>, ${lo === null ? 'n/a' : Math.round(lo)}&deg;C night</div></div>`,
      `<div class="row"><span class="label">Rain</span><span class="pill">${RAIN_LABELS[level]}</span><span>about ${c.rain[i] ?? '?'} mm</span></div>`,
      `<div class="row"><span class="label">Cost</span><b>${'$'.repeat(tier)}</b><span style="opacity:.35">${'$'.repeat(3 - tier)}</span></div>`,
    ];
    if (comfort !== null) {
      rows.push(`<div class="row"><span class="label">Comfort</span><b>${comfort}/5</b><span>${'&#9679;'.repeat(comfort)}<span style="opacity:.3">${'&#9679;'.repeat(5 - comfort)}</span></span></div>`);
    }
    if (flag) {
      const what = flag === 'cold' ? 'Cold nights' : 'Hot nights';
      const gear = flag === 'cold' ? `heating is ${EQUIPMENT[c.heating ?? 'no']}` : `air conditioning is ${EQUIPMENT[c.cooling ?? 'no']}`;
      rows.push(`<div class="row"><span class="pill warn">${what}</span><span>about ${Math.round(lo!)}&deg;C, and ${gear} in typical accommodation.</span></div>`);
    }

    const evs = eventsForMonth(this.data.events, month).filter((e) => this.eventAreas.get(e.id)?.has(id));
    const list = evs.length
      ? `<ul>${evs.map((e) => `<li><button type="button" data-act="event" data-id="${e.id}">${esc(e.name)} <small>(${CATEGORY_LABELS[e.category]})</small></button></li>`).join('')}</ul>`
      : `<p class="sub">No listed events here in ${MONTH_NAMES[i]}.</p>`;
    return `${title}${rows.join('')}<h3>Events</h3>${list}`;
  }

  private eventHtml(e: MapEvent, backTo: string | null): string {
    const notes = (['crowd', 'price', 'perk'] as const)
      .filter((k) => e[k])
      .map((k) => `<p class="event-note"><b>${k[0]!.toUpperCase() + k.slice(1)}</b> ${esc(e[k]!)}</p>`)
      .join('');
    const back = backTo ? `<p><button type="button" data-act="back" data-id="${backTo}">Back to area</button></p>` : '';
    return `<h2>${esc(e.name)}</h2>
      <p class="sub">${CATEGORY_LABELS[e.category]}. ${esc(e.when)}${e.approx ? ' (approximate)' : ''}</p>
      <p>${esc(e.details ?? e.summary)}</p>${notes}${back}`;
  }
}
