import type { AppData } from '../data/load';
import type { AreaProps, MapEvent } from '../data/types';
import { nightFlag } from '../lib/comfort';
import { comfortColor } from '../lib/color';
import { feltHigh } from '../lib/feel';
import { CATEGORY_LABELS, iconFor } from '../lib/events';
import { iconDataUrl } from '../map/icons';
import type { Occurrence } from '../lib/events';
import { circDist, dayFromMonthDay, dayLabel, interpMonthly, isActive, monthOfDay, sectionLabel } from '../lib/season';
import { RAIN_LABELS } from '../lib/rain';
import { esc } from './esc';

const LEVEL_LABELS = {
  country: 'Country (average of its provinces)',
  province: 'Province or region',
  city: 'City sector around the airport',
  island: 'Island',
};
const EQUIPMENT = { yes: 'usually available', partial: 'only sometimes available', no: 'generally not available' };
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

type View =
  | { kind: 'area'; id: string }
  | { kind: 'event'; event: MapEvent; backTo: string | null; occ?: Occurrence }
  | null;

const peakText = (o: Pick<Occurrence, 'day' | 'spread'>) => `peak ${dayLabel(o.day)}${o.spread > 0 ? `, +-${o.spread} days` : ''}`;

export class Panel {
  private view: View = null;
  private props = new Map<string, AreaProps>();

  constructor(
    private el: HTMLElement,
    private data: AppData,
    private getDay: () => number,
    private onChange: (areaId: string | null) => void,
    private occByArea: Map<string, Occurrence[]>,
  ) {
    for (const f of data.areas.features) this.props.set(f.properties.id, f.properties);
    el.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (!t) return;
      if (t.dataset.act === 'close') this.hide();
      else if (t.dataset.act === 'back' && t.dataset.id) this.showArea(t.dataset.id);
      else if (t.dataset.act === 'event') {
        const ev = data.events.find((x) => x.id === t.dataset.id);
        const occ = data.occurrences[Number(t.dataset.oi)];
        if (ev) this.showEvent(ev, this.view?.kind === 'area' ? this.view.id : null, occ);
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

  showEvent(event: MapEvent, backTo: string | null = null, occ?: Occurrence) {
    this.view = { kind: 'event', event, backTo, occ };
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
    if (this.view.kind === 'event') this.open(this.eventHtml(this.view.event, this.view.backTo, this.view.occ));
    else this.open(this.areaHtml(this.view.id));
  }

  private areaHtml(id: string): string {
    const p = this.props.get(id);
    const c = this.data.climate[id];
    const day = this.getDay();
    const i = monthOfDay(day) - 1;
    if (!p) return '<h2>Unknown area</h2>';
    const title = `<h2>${esc(p.name)}${p.iata ? ` <small>${esc(p.iata)}</small>` : ''}</h2><p class="sub">${esc(regionNames.of(p.country) ?? p.country)}, ${LEVEL_LABELS[p.level]}. ${sectionLabel(day)}.</p>`;
    const hi = c ? interpMonthly(c.hi, day) : null;
    const lo = c ? interpMonthly(c.lo, day) : null;
    if (!c || hi === null) return `${title}<p>No climate data for this time of year.</p>`;

    const level = c.rainLevel[i] ?? 0;
    const tier = c.cost[i] ?? 2;
    const comfort = c.comfort?.[i] ?? null;
    const flag = nightFlag(lo, c.heating, c.cooling);
    const wind = c.wind ? interpMonthly(c.wind, day) : null;
    const felt = feltHigh(hi, wind);
    const feltNote = felt !== null && hi - felt >= 1 ? ` <span class="sub">feels like ${Math.round(felt)}&deg;C in the ${Math.round(wind!)} m/s wind</span>` : '';
    const rows = [
      `<div class="row"><span class="temp-swatch" style="background:${comfortColor(felt)}"></span><div><b>${Math.round(hi)}&deg;C day</b>, ${lo === null ? 'n/a' : Math.round(lo)}&deg;C night${feltNote}</div></div>`,
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

    const nearest = new Map<string, Occurrence>();
    for (const o of this.occByArea.get(id) ?? []) {
      if (!isActive(o.day, o.spread, day)) continue;
      const best = nearest.get(o.eventId);
      if (!best || circDist(o.day, day) < circDist(best.day, day)) nearest.set(o.eventId, o);
    }
    const items = [...nearest.values()].flatMap((o) => {
      const e = this.data.events.find((x) => x.id === o.eventId);
      return e ? [{ e, o }] : [];
    });
    const list = items.length
      ? `<ul>${items.map(({ e, o }) => `<li><button type="button" data-act="event" data-id="${e.id}" data-oi="${this.data.occurrences.indexOf(o)}"><img class="ev-icon" alt="" src="${iconDataUrl(iconFor(e))}"> ${esc(e.name)} <small>(${CATEGORY_LABELS[e.category]}, ${peakText(o)})</small></button></li>`).join('')}</ul>`
      : `<p class="sub">No listed events here in ${sectionLabel(day)}.</p>`;
    return `${title}${rows.join('')}<h3>Events</h3>${list}`;
  }

  private eventHtml(e: MapEvent, backTo: string | null, occ?: Occurrence): string {
    const notes = (['crowd', 'price', 'perk'] as const)
      .filter((k) => e[k])
      .map((k) => `<p class="event-note"><b>${k[0]!.toUpperCase() + k.slice(1)}</b> ${esc(e[k]!)}</p>`)
      .join('');
    const spots = e.highlights?.length
      ? `<h3>Main spots</h3><ul>${e.highlights.map((h) => `<li><b>${esc(h.name)}</b>${h.on ? ` <small>(${peakText({ day: dayFromMonthDay(h.on), spread: h.spread ?? 7 })})</small>` : ''}${h.note ? `: ${esc(h.note)}` : ''}</li>`).join('')}</ul>`
      : '';
    const links = e.links
      ? `<p class="links">${[
          e.links.wiki ? `<a href="${esc(e.links.wiki)}" target="_blank" rel="noopener noreferrer">Wikipedia</a>` : '',
          e.links.official ? `<a href="${esc(e.links.official)}" target="_blank" rel="noopener noreferrer">Official site</a>` : '',
        ].filter(Boolean).join(' &middot; ')}</p>`
      : '';
    const back = backTo ? `<p><button type="button" data-act="back" data-id="${backTo}">Back to area</button></p>` : '';
    const here = occ ? `<p><b>${occ.dateLabel ? 'Next' : 'Peak here'}</b> ${esc(occ.dateLabel ?? dayLabel(occ.day))}${!occ.dateLabel && occ.spread > 0 ? `, +-${occ.spread} days` : ''}</p>` : '';
    const title = occ?.label ?? e.name;
    const alias = occ?.label ? `${esc(e.name)}. ` : '';
    return `<h2><img class="ev-icon lg" alt="" src="${iconDataUrl(iconFor(e))}"> ${esc(title)}</h2>
      <p class="sub">${alias}${CATEGORY_LABELS[e.category]}, ${esc(e.when)}${e.approx ? ' (approximate)' : ''}</p>
      ${here}<p>${esc(e.details ?? e.summary)}</p>${notes}${spots}${links}${back}`;
  }
}
