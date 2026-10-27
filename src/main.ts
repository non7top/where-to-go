import 'maplibre-gl/dist/maplibre-gl.css';
import './ui/styles.css';
import { loadAll } from './data/load';
import type { AppData } from './data/load';
import { pointInGeometry } from './lib/geo';
import { comfortColor } from './lib/color';
import { MONTH_NAMES } from './lib/months';
import { etaText, etaTo } from './lib/timeuntil';
import { WeatherMap } from './map/map';
import { renderLegend } from './ui/legend';
import { Panel } from './ui/panel';
import { createMonthBar } from './ui/slider';
import { initMenu } from './ui/menu';
import { cityMenuItems, findCityByCode } from './lib/cities';
import { esc } from './ui/esc';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const OKINAWA = { lon: 127.9, lat: 26.5 };
const CITY_ZOOM = 8;

function showError(message: string) {
  const box = el('error');
  box.textContent = message;
  box.hidden = false;
}

function readHash(): { m?: number; v?: [number, number, number]; c?: string } {
  const p = new URLSearchParams(location.hash.slice(1));
  const m = Number(p.get('m'));
  const v = (p.get('v') ?? '').split(',').map(Number);
  return {
    m: Number.isInteger(m) && m >= 1 && m <= 12 ? m : undefined,
    v: v.length === 3 && v.every(Number.isFinite) ? (v as [number, number, number]) : undefined,
    c: p.get('c') ?? undefined,
  };
}

function eventAreaIndex(data: AppData): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const e of data.events) {
    const ids = new Set<string>();
    for (const f of data.areas.features) {
      const inside = pointInGeometry(e.lon, e.lat, f.geometry);
      // A nationwide event belongs to every area of its country, not only the one around its main point.
      if (inside || (e.country && f.properties.country === e.country)) ids.add(f.properties.id);
    }
    index.set(e.id, ids);
  }
  return index;
}

async function start() {
  let data: AppData;
  try {
    data = await loadAll();
  } catch (e) {
    console.error(e);
    showError('Could not load the map data. Reload to try again.');
    return;
  }

  const initial = readHash();
  let month = initial.m ?? new Date().getMonth() + 1;
  const tooltip = el('tooltip');
  let overEvent = false;
  const areaProps = data.areas.features.map((f) => f.properties);
  const names = new Map(areaProps.map((p) => [p.id, p.iata ? `${p.name} (${p.iata})` : p.name]));
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

  const showTip = (html: string | null, p: { x: number; y: number }) => {
    if (!html) {
      tooltip.hidden = true;
      return;
    }
    const r = el('map').getBoundingClientRect();
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    tooltip.style.left = `${Math.min(r.left + p.x + 14, window.innerWidth - 280)}px`;
    tooltip.style.top = `${r.top + p.y + 14}px`;
  };

  const main = new WeatherMap(el('map'), data, {
    interactive: true,
    center: initial.v ? [initial.v[0], initial.v[1]] : undefined,
    zoom: initial.v?.[2],
    handlers: {
      onArea: (id) => panel.showArea(id),
      onEvent: (ev) => panel.showEvent(ev),
      onHoverEvent: (ev, p, label) => {
        overEvent = ev !== null;
        if (ev) showTip(`<b>${esc(label ? `${label}: ${ev.name}` : ev.name)}</b><small>${esc(ev.summary)}</small>`, p);
      },
      onHoverArea: (id, p) => {
        if (!id) return overEvent ? undefined : showTip(null, p);
        const hi = data.climate[id]?.hi[month - 1];
        showTip(`<b>${esc(names.get(id) ?? '')}</b><small>${hi == null ? 'no data' : `${Math.round(hi)}&deg;C daytime high`}</small>`, p);
      },
    },
  });
  if (!initial.v) main.fitRegion();

  const inset = new WeatherMap(el('inset-map'), data, { interactive: false, center: [OKINAWA.lon, OKINAWA.lat], zoom: 6.4 });

  const panel = new Panel(el('panel'), data, () => month, (id) => main.setSelected(id), eventAreaIndex(data));

  const writeHash = () => {
    const c = main.map.getCenter();
    const hash = `#m=${month}&v=${c.lng.toFixed(2)},${c.lat.toFixed(2)},${main.map.getZoom().toFixed(2)}`;
    history.replaceState(null, '', hash);
  };
  main.map.on('moveend', writeHash);

  const today = new Date();
  const updateEta = () => {
    el('month-eta').textContent = etaText(etaTo(today, month));
  };
  const bar = createMonthBar(el('month-bar'), month, today.getMonth() + 1, (m) => {
    month = m;
    main.setMonth(m);
    inset.setMonth(m);
    panel.refresh();
    updateEta();
    writeHash();
  });
  window.addEventListener('hashchange', () => {
    const h = readHash();
    if (h.m && h.m !== month) {
      month = h.m;
      bar.set(month);
      main.setMonth(month);
      inset.setMonth(month);
      panel.refresh();
      updateEta();
    }
  });
  updateEta();
  main.setMonth(month);
  inset.setMonth(month);

  renderLegend(el('legend'));

  const goCity = (id: string) => {
    const p = areaProps.find((a) => a.id === id);
    if (!p) return;
    main.flyTo(p.point[0], p.point[1], CITY_ZOOM);
    panel.showArea(id);
  };
  const cityMenu = initMenu(
    el<HTMLButtonElement>('cities-btn'),
    el('city-menu'),
    cityMenuItems(areaProps, (cc) => regionNames.of(cc) ?? cc),
    goCity,
  );
  const placeMenu = initMenu(
    el<HTMLButtonElement>('shortcuts-btn'),
    el('shortcut-menu'),
    data.shortcuts.map((s) => ({ id: s.id, label: s.name })),
    (id) => {
      const s = data.shortcuts.find((x) => x.id === id);
      if (s) main.flyTo(s.lon, s.lat, s.zoom);
    },
  );
  const startCity = initial.c ? findCityByCode(areaProps, initial.c) : undefined;
  if (startCity) main.map.once('load', () => goCity(startCity.id));
  el('reset-btn').addEventListener('click', () => {
    panel.hide();
    main.fitRegion(true);
  });
  el('inset').addEventListener('click', () => main.flyTo(OKINAWA.lon, OKINAWA.lat, 7));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (cityMenu.close() || placeMenu.close()) return;
    if (panel.isOpen()) panel.hide();
  });

  // Exposed for browser checks only.
  Object.assign(window, { __wtg: { main, inset, comfortColor, MONTH_NAMES } });
}

void start();
