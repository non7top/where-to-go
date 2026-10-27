import type { AppData } from '../data/load';
import { rankGreen } from '../lib/best';
import type { Pick } from '../lib/best';
import { comfortColor } from '../lib/color';
import { CATEGORY_LABELS, iconFor } from '../lib/events';
import type { Occurrence } from '../lib/events';
import { feltHigh } from '../lib/feel';
import { inBounds } from '../lib/scope';
import type { Bounds } from '../lib/scope';
import { circDist, dayLabel, interpMonthly, isActive, sectionLabel } from '../lib/season';
import { iconDataUrl } from '../map/icons';
import { esc } from './esc';
import { flagImg } from './flags';

const TOP = 10;
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export interface PicksOptions {
  el: HTMLElement;
  data: AppData;
  getDay: () => number;
  getScope: () => Bounds | null;
  isSelecting: () => boolean;
  occByArea: Map<string, Occurrence[]>;
  onPick: (id: string) => void;
  onEvent: (eventId: string, occ: Occurrence) => void;
  actions: { toggleSelect: () => void; clearScope: () => void; zoomScope: () => void };
  // Hovering a row previews it on the map; null clears the preview.
  onHoverArea: (id: string | null) => void;
  onHoverEvent: (eventId: string | null, country: string) => void;
}

// The right-hand card: the top 10 comfortable places on top, the events of the period below
// (five rows tall, scrolling). Both follow the selected rectangle on the map, if there is one.
export class Picks {
  private last = '';

  constructor(private o: PicksOptions) {
    o.el.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-id],[data-oi]');
      if (!t) return;
      if (t.dataset.act === 'select') o.actions.toggleSelect();
      else if (t.dataset.act === 'clear') o.actions.clearScope();
      else if (t.dataset.act === 'zoom') o.actions.zoomScope();
      else if (t.dataset.oi !== undefined) {
        const occ = o.data.occurrences[Number(t.dataset.oi)];
        if (occ) o.onEvent(occ.eventId, occ);
      } else if (t.dataset.id) o.onPick(t.dataset.id);
    });
    o.el.addEventListener('mouseover', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-id],[data-ev]');
      if (t?.dataset.ev) o.onHoverEvent(t.dataset.ev, t.dataset.cc ?? '');
      else if (t?.dataset.id) o.onHoverArea(t.dataset.id);
    });
    o.el.addEventListener('mouseout', (e) => {
      const to = e.relatedTarget as HTMLElement | null;
      if (!to || !to.closest?.('[data-id],[data-ev]')) {
        o.onHoverArea(null);
        o.onHoverEvent(null, '');
      }
    });
  }

  refresh() {
    const { data, el } = this.o;
    const day = this.o.getDay();
    const scope = this.o.getScope();
    const areas = data.areas.features.map((f) => f.properties).filter((a) => inBounds(scope, a.point[0], a.point[1]));
    const cityNames = new Set(areas.filter((a) => a.level === 'city').map((a) => a.name));
    // A province named like a city (Seoul, Busan, Tokyo) would only repeat the city row.
    const ranked = [
      ...rankGreen(areas, data.climate, day, ['city']),
      ...rankGreen(areas, data.climate, day, ['province']).filter((p) => !cityNames.has(p.name)),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP);

    const byCountry = new Map<string, Pick[]>();
    for (const p of ranked) byCountry.set(p.country, [...(byCountry.get(p.country) ?? []), p]);
    const groups = [...byCountry.entries()].map(
      ([cc, rows]) => `<h3 class="country">${flagImg(cc)}${esc(regionNames.of(cc) ?? cc)}</h3><ul>${rows.map((p) => this.row(p, day)).join('')}</ul>`,
    );

    const selecting = this.o.isSelecting();
    const tools = scope
      ? `<span class="chip">Selected area <button type="button" data-act="zoom">Zoom</button><button type="button" data-act="clear">Clear</button></span>`
      : '';
    const hint = selecting ? 'Drag a rectangle on the map' : scope ? '' : 'Or hold Shift and drag on the map';
    const html = `<section class="pk pk-places">
        <div class="pk-head">
          <h2>Top ${TOP} green places</h2>
          <p class="sub">${esc(sectionLabel(day))}${scope ? ', in the selected area' : ''}</p>
          <div class="pk-tools">
            <button type="button" data-act="select" aria-pressed="${selecting}" class="${selecting ? 'on' : ''}">Select area</button>${tools}
            <span class="hint">${hint}</span>
          </div>
        </div>
        <div class="pk-scroll" data-scroll="places">${groups.join('') || '<p class="sub">Nothing in the green range here.</p>'}</div>
      </section>
      <section class="pk pk-events">
        <h3>Events</h3>
        <div class="pk-scroll" data-scroll="events">${this.events(day, scope)}</div>
      </section>`;
    if (html === this.last) return;
    this.last = html;
    const keep = [...el.querySelectorAll<HTMLElement>('[data-scroll]')].map((s) => [s.dataset.scroll, s.scrollTop] as const);
    el.innerHTML = html;
    for (const [name, top] of keep) {
      const s = el.querySelector<HTMLElement>(`[data-scroll="${name}"]`);
      if (s) s.scrollTop = top;
    }
  }

  // Every event whose peak window reaches the section, nearest peak first; one row per country for a season front.
  private events(day: number, scope: Bounds | null): string {
    const { data } = this.o;
    const groups = new Map<string, { best: number; n: number }>();
    data.occurrences.forEach((o, i) => {
      if (!isActive(o.day, o.spread, day) || !inBounds(scope, o.lon, o.lat)) return;
      const key = `${o.eventId}|${o.label ? (o.country ?? '') : ''}`;
      const g = groups.get(key);
      if (!g) groups.set(key, { best: i, n: 1 });
      else {
        g.n++;
        if (circDist(o.day, day) < circDist(data.occurrences[g.best]!.day, day)) g.best = i;
      }
    });
    const rows = [...groups.values()]
      .sort((a, b) => circDist(data.occurrences[a.best]!.day, day) - circDist(data.occurrences[b.best]!.day, day))
      .flatMap((g) => {
        const occ = data.occurrences[g.best]!;
        const e = data.events.find((x) => x.id === occ.eventId);
        if (!e) return [];
        const flag = occ.label && occ.country ? flagImg(occ.country) : '';
        const detail = g.n > 1 ? `${g.n} areas, peak around ${dayLabel(occ.day)}` : e.when;
        return [`<li><button type="button" data-oi="${data.occurrences.indexOf(occ)}" data-ev="${esc(occ.eventId)}" data-cc="${esc(occ.label ? (occ.country ?? '') : '')}"><img class="ev-icon" alt="" src="${iconDataUrl(iconFor(e))}"><span class="pick-main"><b>${flag}${esc(occ.label ?? e.name)}</b><small>${CATEGORY_LABELS[e.category]}, ${esc(detail)}</small></span></button></li>`];
      });
    return rows.length ? `<ul>${rows.join('')}</ul>` : '<p class="sub">No listed events in this period.</p>';
  }

  private row(p: Pick, day: number): string {
    const { data } = this.o;
    const c = data.climate[p.id];
    const shown = c ? interpMonthly(c.hi, day) : null;
    const events = new Set((this.o.occByArea.get(p.id) ?? []).filter((o) => isActive(o.day, o.spread, day)).map((o) => o.eventId)).size;
    const wind = c?.wind ? interpMonthly(c.wind, day) : null;
    const felt = feltHigh(shown, wind);
    const rain = p.rainLevel >= 2 ? `<span class="pill" title="Rainy season">${p.rainLevel === 3 ? 'heavy rain' : 'rainy'}</span>` : '';
    const label = p.iata ? `${esc(p.name)} <small>${esc(p.iata)}</small>` : esc(p.name);
    return `<li><button type="button" data-id="${esc(p.id)}">
      <span class="temp-swatch sm" style="background:${comfortColor(felt)}"></span>
      <span class="pick-main"><b>${label}</b><small>${p.level === 'city' ? 'City' : 'Region'}</small></span>
      <span class="pick-meta">${Math.round(p.felt)}&deg;C ${'$'.repeat(p.cost)}${rain}${events ? ` <span class="ev">&#9733;${events}</span>` : ''}</span>
    </button></li>`;
  }
}
