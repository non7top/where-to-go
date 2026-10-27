import 'maplibre-gl/dist/maplibre-gl.css';
import './ui/styles.css';
import { loadAll } from './data/load';
import type { AppData } from './data/load';
import { bboxOf, pointInGeometry } from './lib/geo';
import { comfortColor, yearColors } from './lib/color';
import type { Occurrence } from './lib/events';
import { circDist, dayOfYear, interpMonthly, MID_DAY, wrapDay } from './lib/season';
import { etaText, etaToDay } from './lib/timeuntil';
import { WeatherMap } from './map/map';
import { createDial } from './ui/dial';
import type { Dial } from './ui/dial';
import { createRing } from './ui/ring';
import { renderLegend } from './ui/legend';
import { Panel } from './ui/panel';
import { Picks } from './ui/picks';
import { initMenu } from './ui/menu';
import { cityMenuItems, findCityByCode } from './lib/cities';
import { esc } from './ui/esc';
import type { AreaProps } from './data/types';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const OKINAWA = { lon: 127.9, lat: 26.5 };
const CITY_ZOOM = 8;
const REGION_ZOOM = 6;
const STYLE_KEY = 'wtg-dial';
type DialStyle = 'drum' | 'ring';

function storedStyle(): DialStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === 'ring' ? 'ring' : 'drum';
  } catch {
    return 'drum';
  }
}

function showError(message: string) {
  const box = el('error');
  box.textContent = message;
  box.hidden = false;
}

function readHash(): { d?: number; v?: [number, number, number]; c?: string } {
  const p = new URLSearchParams(location.hash.slice(1));
  const d = p.get('d') !== null ? Number(p.get('d')) : NaN;
  const m = Number(p.get('m'));
  const v = (p.get('v') ?? '').split(',').map(Number);
  return {
    d: Number.isFinite(d) ? wrapDay(d) : Number.isInteger(m) && m >= 1 && m <= 12 ? MID_DAY[m - 1] : undefined,
    v: v.length === 3 && v.every(Number.isFinite) ? (v as [number, number, number]) : undefined,
    c: p.get('c') ?? undefined,
  };
}

// Each area lists the dated places that fall inside it, plus nationwide events and front entries for it.
function occurrencesByArea(data: AppData): Map<string, Occurrence[]> {
  const index = new Map<string, Occurrence[]>();
  const add = (areaId: string, o: Occurrence) => {
    const list = index.get(areaId);
    if (list) list.push(o);
    else index.set(areaId, [o]);
  };
  const boxes = data.areas.features.map((f) => bboxOf(f.geometry));
  const countryOf = new Map(data.events.map((e) => [e.id, e.country]));
  for (const o of data.occurrences) {
    const country = countryOf.get(o.eventId);
    data.areas.features.forEach((f, i) => {
      const b = boxes[i]!;
      const inside = o.lon >= b[0] && o.lon <= b[2] && o.lat >= b[1] && o.lat <= b[3] && pointInGeometry(o.lon, o.lat, f.geometry);
      // A nationwide event belongs to every area of its country, not only the one around its main point.
      if (inside || f.properties.id === o.areaId || (country && f.properties.country === country)) add(f.properties.id, o);
    });
  }
  return index;
}

const LEVEL_RANK: Record<AreaProps['level'], number> = { city: 0, island: 1, province: 2, country: 3 };

// The most specific area under a point, so the dial can show that place's year.
function areaFinder(data: AppData): (lon: number, lat: number) => AreaProps | undefined {
  const items = data.areas.features
    .map((f) => ({ f, box: bboxOf(f.geometry) }))
    .sort((a, b) => LEVEL_RANK[a.f.properties.level] - LEVEL_RANK[b.f.properties.level]);
  return (lon, lat) =>
    items.find(({ f, box }) => lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3] && pointInGeometry(lon, lat, f.geometry))?.f.properties;
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
  const today = new Date();
  const todayDay = dayOfYear(today);
  let day = initial.d ?? todayDay;
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
      onEvent: (ev, occ) => panel.showEvent(ev, null, occ),
      onHoverEvent: (ev, p, label) => {
        overEvent = ev !== null;
        if (ev) showTip(`<b>${esc(label ? `${label}: ${ev.name}` : ev.name)}</b><small>${esc(ev.summary)}</small>`, p);
      },
      onHoverArea: (id, p) => {
        if (!id) return overEvent ? undefined : showTip(null, p);
        const c = data.climate[id];
        const hi = c ? interpMonthly(c.hi, day) : null;
        showTip(`<b>${esc(names.get(id) ?? '')}</b><small>${hi === null ? 'no data' : `${Math.round(hi)}&deg;C daytime high`}</small>`, p);
      },
    },
  });
  if (!initial.v) main.fitRegion();

  const inset = new WeatherMap(el('inset-map'), data, { interactive: false, center: [OKINAWA.lon, OKINAWA.lat], zoom: 6.4 });

  const occByArea = occurrencesByArea(data);
  let selectedAreaId: string | null = null;
  let refreshBand = () => {};
  const panel = new Panel(el('panel'), data, () => day, (id) => {
    selectedAreaId = id;
    main.setSelected(id);
    refreshBand();
  }, occByArea);
  const goArea = (id: string) => {
    const p = areaProps.find((a) => a.id === id);
    if (!p) return;
    main.flyTo(p.point[0], p.point[1], p.level === 'city' ? CITY_ZOOM : REGION_ZOOM);
    panel.showArea(id);
  };
  const picks = new Picks(el('picks'), data, () => day, goArea, occByArea, (eventId, occ) => {
    const ev = data.events.find((x) => x.id === eventId);
    if (!ev) return;
    main.flyTo(occ.lon, occ.lat, REGION_ZOOM);
    panel.showEvent(ev, null, occ);
  });

  const writeHash = () => {
    const c = main.map.getCenter();
    history.replaceState(null, '', `#d=${Math.round(day)}&v=${c.lng.toFixed(2)},${c.lat.toFixed(2)},${main.map.getZoom().toFixed(2)}`);
  };
  main.map.on('moveend', writeHash);

  // Turning the dial can fire many times per frame, so the map updates once per frame.
  let frame = 0;
  let hashTimer = 0;
  const apply = () => {
    frame = 0;
    main.setDay(day);
    inset.setDay(day);
    panel.refresh();
    picks.refresh();
    clearTimeout(hashTimer);
    hashTimer = window.setTimeout(writeHash, 300);
  };
  let style = storedStyle();
  const onDay = (d: number) => {
    day = d;
    for (const k of Object.keys(dials) as DialStyle[]) if (k !== style) dials[k].set(d);
    if (!frame) frame = requestAnimationFrame(apply);
  };
  const etaOf = (d: number) => etaText(etaToDay(today, d));
  const dials: Record<DialStyle, Dial> = {
    drum: createDial(el('dial-drum'), day, todayDay, onDay, etaOf),
    ring: createRing(el('dial-ring'), day, todayDay, onDay, etaOf),
  };
  const setAllDials = (d: number) => {
    for (const k of Object.keys(dials) as DialStyle[]) dials[k].set(d);
  };
  const showStyle = () => {
    el('dial-drum').hidden = style !== 'drum';
    el('dial-ring').hidden = style !== 'ring';
    document.body.classList.toggle('dial-ring', style === 'ring');
    el('dial-switch').textContent = style === 'drum' ? 'Ring view' : 'Drum view';
    dials[style].set(day);
  };
  el('dial-switch').addEventListener('click', () => {
    style = style === 'drum' ? 'ring' : 'drum';
    try {
      localStorage.setItem(STYLE_KEY, style);
    } catch {
      // The choice just is not remembered.
    }
    showStyle();
  });
  showStyle();

  // Tint both dials with the year's climate for whatever is at the center of the map.
  const findArea = areaFinder(data);
  const bandCache = new Map<string, string[]>();
  let bandArea = '';
  let bandFrame = 0;
  const updateBand = () => {
    bandFrame = 0;
    // A selected area wins; otherwise whatever is at the center of the map.
    const c = main.map.getCenter();
    const area = (selectedAreaId ? areaProps.find((a) => a.id === selectedAreaId) : undefined) ?? findArea(c.lng, c.lat);
    if (!area || area.id === bandArea) return;
    bandArea = area.id;
    let colors = bandCache.get(area.id);
    if (!colors) {
      colors = yearColors(data.climate[area.id]);
      bandCache.set(area.id, colors);
    }
    for (const k of Object.keys(dials) as DialStyle[]) dials[k].setBand(colors, area.name);
  };
  main.map.on('move', () => {
    if (!bandFrame) bandFrame = requestAnimationFrame(updateBand);
  });
  refreshBand = updateBand;
  updateBand();
  window.addEventListener('hashchange', () => {
    const h = readHash();
    if (h.d !== undefined && circDist(h.d, day) > 0.5) {
      day = h.d;
      setAllDials(day);
      apply();
    }
  });
  main.setDay(day);
  inset.setDay(day);
  picks.refresh();
  el('picks-btn').addEventListener('click', () => {
    const open = document.body.classList.toggle('picks-open');
    el('picks-btn').setAttribute('aria-expanded', String(open));
  });

  renderLegend(el('legend'));

  const cityMenu = initMenu(
    el<HTMLButtonElement>('cities-btn'),
    el('city-menu'),
    cityMenuItems(areaProps, (cc) => regionNames.of(cc) ?? cc),
    goArea,
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
  if (startCity) main.map.once('load', () => goArea(startCity.id));
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
  Object.assign(window, {
    __wtg: {
      main,
      inset,
      comfortColor,
      setDay: (d: number) => {
        day = wrapDay(d);
        setAllDials(day);
        apply();
      },
    },
  });
}

void start();
