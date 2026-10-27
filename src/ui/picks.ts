import type { AppData } from '../data/load';
import { rankGreen } from '../lib/best';
import type { Pick } from '../lib/best';
import { comfortColor } from '../lib/color';
import { CATEGORY_LABELS } from '../lib/events';
import type { Occurrence } from '../lib/events';
import { feltHigh } from '../lib/feel';
import { circDist, interpMonthly, isActive, sectionLabel } from '../lib/season';
import { esc } from './esc';
import { flagImg } from './flags';

const PER_COUNTRY_CITIES = 3;
const PER_COUNTRY_REGIONS = 2;
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

// Right-hand list of the most comfortable (green) cities and regions for the selected 15-day section.
export class Picks {
  constructor(
    private el: HTMLElement,
    private data: AppData,
    private getDay: () => number,
    private onPick: (id: string) => void,
    private occByArea: Map<string, Occurrence[]>,
    private onEvent: (eventId: string, occ: Occurrence) => void,
  ) {
    el.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-id],[data-oi]');
      if (t?.dataset.oi !== undefined) {
        const occ = data.occurrences[Number(t.dataset.oi)];
        if (occ) onEvent(occ.eventId, occ);
      } else if (t?.dataset.id) onPick(t.dataset.id);
    });
  }

  refresh() {
    const day = this.getDay();
    const areas = this.data.areas.features.map((f) => f.properties);
    const cityNames = new Set(areas.filter((a) => a.level === 'city').map((a) => a.name));
    const cities = rankGreen(areas, this.data.climate, day, ['city']);
    // A province named like a city (Seoul, Busan, Tokyo) would only repeat the city row.
    const regions = rankGreen(areas, this.data.climate, day, ['province']).filter((p) => !cityNames.has(p.name));

    const byCountry = new Map<string, { cities: Pick[]; regions: Pick[]; best: number }>();
    const group = (p: Pick) => {
      let g = byCountry.get(p.country);
      if (!g) byCountry.set(p.country, (g = { cities: [], regions: [], best: 0 }));
      g.best = Math.max(g.best, p.score);
      return g;
    };
    for (const p of cities) group(p).cities.push(p);
    for (const p of regions) group(p).regions.push(p);

    const sections = [...byCountry.entries()]
      .sort((a, b) => b[1].best - a[1].best)
      .map(([cc, g]) => {
        const rows = [...g.cities.slice(0, PER_COUNTRY_CITIES), ...g.regions.slice(0, PER_COUNTRY_REGIONS)];
        return `<h3 class="country">${flagImg(cc)}${esc(regionNames.of(cc) ?? cc)}</h3><ul>${rows.map((p) => this.row(p, day)).join('')}</ul>`;
      });
    this.el.innerHTML = `<h2>Green places</h2>
      <p class="sub">Comfortable weather, ${esc(sectionLabel(day))}, by country</p>
      ${sections.join('') || '<p class="sub">Nothing in the green range.</p>'}${this.events(day)}`;
  }

  // Every event whose peak window reaches the section, nearest peak first; a season front counts once.
  private events(day: number): string {
    const groups = new Map<string, { best: number; n: number }>();
    this.data.occurrences.forEach((o, i) => {
      if (!isActive(o.day, o.spread, day)) return;
      const g = groups.get(o.eventId);
      if (!g) groups.set(o.eventId, { best: i, n: 1 });
      else {
        g.n++;
        if (circDist(o.day, day) < circDist(this.data.occurrences[g.best]!.day, day)) g.best = i;
      }
    });
    const rows = [...groups.entries()]
      .sort((a, b) => circDist(this.data.occurrences[a[1].best]!.day, day) - circDist(this.data.occurrences[b[1].best]!.day, day))
      .flatMap(([id, g]) => {
        const e = this.data.events.find((x) => x.id === id);
        return e ? [`<li><button type="button" data-oi="${g.best}"><span class="cat-dot cat-${e.category}"></span><span class="pick-main"><b>${esc(e.name)}</b><small>${CATEGORY_LABELS[e.category]}, ${esc(e.when)}${g.n > 1 ? `, ${g.n} areas` : ''}</small></span></button></li>`] : [];
      });
    return rows.length ? `<h3>Events</h3><ul>${rows.join('')}</ul>` : '<h3>Events</h3><p class="sub">No listed events in this period.</p>';
  }

  private row(p: Pick, day: number): string {
    const c = this.data.climate[p.id];
    const shown = c ? interpMonthly(c.hi, day) : null;
    const events = new Set((this.occByArea.get(p.id) ?? []).filter((o) => isActive(o.day, o.spread, day)).map((o) => o.eventId)).size;
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
