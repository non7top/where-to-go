import { Map as GLMap, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type { GeoJSONSource, LayerSpecification, MapGeoJSONFeature, Point } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point as GeoPoint } from 'geojson';
import type { AppData } from '../data/load';
import type { EventCategory, Level, MapEvent } from '../data/types';
import { comfortColor, NO_DATA_COLOR } from '../lib/color';
import { feltHigh } from '../lib/feel';
import { eventsForMonth } from '../lib/events';
import { isMarked } from '../lib/rain';
import { clusterIcon, eventIcon, RAIN_PATTERNS, rainTile, starIcon, tileImage } from './patterns';

// maplibre-gl 6 finds its worker next to the main script, which a bundler breaks.
// The standalone (file://) build sets __WTG_WORKER_URL__ to an inline blob instead.
setWorkerUrl((globalThis as { __WTG_WORKER_URL__?: string }).__WTG_WORKER_URL__ ?? workerUrl);

export const COUNTRY_MAXZOOM = 2.2;
export const CITY_MINZOOM = 4;
export const ISLAND_MINZOOM = 5;
export const REGION_BOUNDS: [[number, number], [number, number]] = [[92, -10], [146, 48]];

const LEVELS: { level: Level; minzoom: number; maxzoom: number }[] = [
  { level: 'country', minzoom: 0, maxzoom: COUNTRY_MAXZOOM },
  { level: 'province', minzoom: COUNTRY_MAXZOOM, maxzoom: 24 },
  { level: 'city', minzoom: CITY_MINZOOM, maxzoom: 24 },
  { level: 'island', minzoom: ISLAND_MINZOOM, maxzoom: 24 },
];
const CATEGORIES: EventCategory[] = ['festival', 'fair', 'seasonal', 'holiday', 'concert'];

interface XY {
  x: number;
  y: number;
}

export interface MapHandlers {
  onArea?: (id: string) => void;
  onEvent?: (event: MapEvent) => void;
  onHoverArea?: (id: string | null, point: XY) => void;
  onHoverEvent?: (event: MapEvent | null, point: XY, label?: string) => void;
}

export interface MapOptions {
  interactive: boolean;
  center?: [number, number];
  zoom?: number;
  handlers?: MapHandlers;
}

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export class WeatherMap {
  readonly map: GLMap;
  private month = 1;
  private ready = false;
  private hoverId: string | null = null;
  private selectedId: string | null = null;
  private eventsById = new globalThis.Map<string, MapEvent>();

  constructor(container: HTMLElement, private data: AppData, private opts: MapOptions) {
    for (const e of data.events) this.eventsById.set(e.id, e);
    this.map = new GLMap({
      container,
      style: { version: 8, sources: {}, layers: [] },
      center: opts.center ?? [114, 22],
      zoom: opts.zoom ?? 3,
      minZoom: 1.5,
      maxZoom: 11,
      interactive: opts.interactive,
      attributionControl: false,
      fadeDuration: 0,
      dragRotate: false,
      pitchWithRotate: false,
    });
    if (opts.interactive) {
      this.map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
      this.map.touchZoomRotate.disableRotation();
    }
    this.map.on('load', () => this.init());
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.applyTheme());
  }

  private init() {
    const { map, data } = this;
    map.addSource('land', { type: 'geojson', data: data.land });
    map.addSource('areas', { type: 'geojson', data: data.areas, promoteId: 'id' });

    map.addImage(RAIN_PATTERNS.moderate, tileImage(rainTile('moderate')), { pixelRatio: 2 });
    map.addImage(RAIN_PATTERNS.heavy, tileImage(rainTile('heavy')), { pixelRatio: 2 });

    const layers: LayerSpecification[] = [
      { id: 'ocean', type: 'background', paint: { 'background-color': css('--ocean') } },
      { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': css('--land') } },
    ];
    for (const { level, minzoom, maxzoom } of LEVELS) {
      layers.push({
        id: `fill-${level}`, type: 'fill', source: 'areas', minzoom, maxzoom,
        filter: ['==', ['get', 'level'], level],
        paint: { 'fill-color': ['coalesce', ['feature-state', 'color'], NO_DATA_COLOR] },
      });
      for (const [kind, rainLevel] of [['moderate', 2], ['heavy', 3]] as const) {
        layers.push({
          id: `rain-${kind}-${level}`, type: 'fill', source: 'areas', minzoom, maxzoom,
          filter: ['==', ['get', 'level'], level],
          paint: {
            'fill-pattern': RAIN_PATTERNS[kind],
            'fill-opacity': ['case', ['==', ['feature-state', 'rain'], rainLevel], 1, 0],
          },
        });
      }
      layers.push({
        id: `line-${level}`, type: 'line', source: 'areas', minzoom, maxzoom,
        filter: ['==', ['get', 'level'], level],
        paint: {
          'line-color': css(level === 'city' ? '--text' : '--outline'),
          'line-width': level === 'city' ? 1.6 : ['interpolate', ['linear'], ['zoom'], 2, 0.3, 5, 0.8, 9, 1.4],
        },
      });
    }
    layers.push(
      {
        id: 'border-country', type: 'line', source: 'areas',
        filter: ['==', ['get', 'level'], 'country'],
        layout: { 'line-join': 'round' },
        paint: {
          'line-color': css('--border-strong'),
          'line-opacity': 0.9,
          'line-width': ['interpolate', ['linear'], ['zoom'], 1.5, 1.2, 5, 2.4, 9, 3.6],
        },
      },
      {
        id: 'area-hover', type: 'line', source: 'areas',
        paint: {
          'line-color': css('--text'),
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.2, 0],
        },
      },
      {
        id: 'area-selected', type: 'line', source: 'areas',
        paint: {
          'line-color': css('--accent'),
          'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 3.4, 0],
        },
      },
    );
    for (const l of layers) map.addLayer(l);

    if (this.opts.interactive) this.initEvents();
    this.ready = true;
    this.setMonth(this.month);
    this.applyTheme();
  }

  private initEvents() {
    const { map } = this;
    for (const c of CATEGORIES) map.addImage(c, eventIcon(c), { pixelRatio: 2 });
    map.addImage('cluster', clusterIcon(), { pixelRatio: 2 });
    map.addImage('star', starIcon(), { pixelRatio: 2 });
    map.addSource('stars', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addSource('events', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterRadius: 34,
      clusterMaxZoom: 8,
    });
    map.addLayer({
      id: 'event-clusters', type: 'symbol', source: 'events', filter: ['has', 'point_count'],
      layout: {
        'icon-image': 'cluster', 'icon-allow-overlap': true,
        'icon-size': ['step', ['get', 'point_count'], 0.95, 3, 1.15, 6, 1.35],
      },
    });
    map.addLayer({
      id: 'event-stars', type: 'symbol', source: 'stars',
      layout: { 'icon-image': 'star', 'icon-allow-overlap': true, 'icon-size': 0.9 },
    });
    map.addLayer({
      id: 'event-points', type: 'symbol', source: 'events', filter: ['!', ['has', 'point_count']],
      layout: { 'icon-image': ['get', 'category'], 'icon-allow-overlap': true, 'icon-size': 1 },
    });

    const areaLayers = LEVELS.map((l) => `fill-${l.level}`);
    const eventLayers = ['event-points', 'event-clusters'];

    map.on('mousemove', (e) => {
      const eh = this.eventHit(e.point);
      const ev = eh?.event ?? null;
      const hit = ev ? null : this.areaAt(e.point, areaLayers);
      this.setHover(hit);
      map.getCanvas().style.cursor = ev || hit || this.clusterAt(e.point) ? 'pointer' : '';
      this.opts.handlers?.onHoverEvent?.(ev, e.point, eh?.label);
      this.opts.handlers?.onHoverArea?.(hit, e.point);
    });
    map.on('mouseout', () => {
      this.setHover(null);
      this.opts.handlers?.onHoverEvent?.(null, { x: 0, y: 0 });
      this.opts.handlers?.onHoverArea?.(null, { x: 0, y: 0 });
    });
    map.on('click', async (e) => {
      const ev = this.eventHit(e.point)?.event;
      if (ev) return void this.opts.handlers?.onEvent?.(ev);
      const cluster = this.clusterAt(e.point, eventLayers);
      if (cluster) {
        const zoom = await (map.getSource('events') as GeoJSONSource).getClusterExpansionZoom(cluster.id as number);
        map.easeTo({ center: (cluster.geometry as GeoPoint).coordinates as [number, number], zoom: zoom + 0.5 });
        return;
      }
      const id = this.areaAt(e.point, areaLayers);
      if (id) this.opts.handlers?.onArea?.(id);
    });
  }

  private eventHit(point: Point): { event: MapEvent; label?: string } | null {
    const f = this.map.queryRenderedFeatures(point, { layers: ['event-points', 'event-stars'] })[0];
    if (!f) return null;
    const isStar = f.layer.id === 'event-stars';
    const event = this.eventsById.get((isStar ? f.properties?.eventId : f.properties?.id) as string);
    return event ? { event, label: isStar ? (f.properties?.name as string) : undefined } : null;
  }

  private clusterAt(point: Point, layers = ['event-clusters']): MapGeoJSONFeature | undefined {
    if (!this.map.getLayer('event-clusters')) return undefined;
    return this.map.queryRenderedFeatures(point, { layers })[0];
  }

  private areaAt(point: Point, layers: string[]): string | null {
    const present = layers.filter((l) => this.map.getLayer(l));
    const f = this.map.queryRenderedFeatures(point, { layers: present })[0];
    return f ? (f.id as string) : null;
  }

  private setHover(id: string | null) {
    if (id === this.hoverId) return;
    if (this.hoverId) this.map.setFeatureState({ source: 'areas', id: this.hoverId }, { hover: false });
    this.hoverId = id;
    if (id) this.map.setFeatureState({ source: 'areas', id }, { hover: true });
  }

  setSelected(id: string | null) {
    if (!this.ready) return;
    if (this.selectedId) this.map.setFeatureState({ source: 'areas', id: this.selectedId }, { selected: false });
    this.selectedId = id;
    if (id) this.map.setFeatureState({ source: 'areas', id }, { selected: true });
  }

  setMonth(month: number) {
    this.month = month;
    if (!this.ready) return;
    const i = month - 1;
    for (const f of this.data.areas.features) {
      const id = f.properties.id;
      const c = this.data.climate[id];
      const level = c?.rainLevel[i] ?? null;
      this.map.setFeatureState({ source: 'areas', id }, {
        color: comfortColor(feltHigh(c?.hi[i] ?? null, c?.wind?.[i])),
        rain: isMarked(level) ? level : 0,
      });
    }
    this.setEvents(month);
  }

  private setEvents(month: number) {
    const source = this.map.getSource('events') as GeoJSONSource | undefined;
    if (!source) return;
    const features: Feature<GeoPoint>[] = eventsForMonth(this.data.events, month).map((e) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
      properties: { id: e.id, category: e.category },
    }));
    const fc: FeatureCollection<GeoPoint> = { type: 'FeatureCollection', features };
    source.setData(fc);

    const stars: Feature<GeoPoint>[] = eventsForMonth(this.data.events, month).flatMap((e) =>
      (e.highlights ?? []).map((h) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [h.lon, h.lat] },
        properties: { eventId: e.id, name: h.name },
      })),
    );
    (this.map.getSource('stars') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: stars });
  }

  applyTheme() {
    if (!this.ready) return;
    const { map } = this;
    map.setPaintProperty('ocean', 'background-color', css('--ocean'));
    map.setPaintProperty('land', 'fill-color', css('--land'));
    for (const { level } of LEVELS) {
      map.setPaintProperty(`line-${level}`, 'line-color', css(level === 'city' ? '--text' : '--outline'));
    }
    map.setPaintProperty('border-country', 'line-color', css('--border-strong'));
    map.setPaintProperty('area-hover', 'line-color', css('--text'));
    map.setPaintProperty('area-selected', 'line-color', css('--accent'));
  }

  fitRegion(animate = false) {
    const padding = window.innerWidth < 720
      ? { top: 70, bottom: 30, left: 10, right: 62 }
      : { top: 70, bottom: 110, left: 20, right: 20 };
    this.map.fitBounds(REGION_BOUNDS, { padding, animate, duration: 700 });
  }

  flyTo(lon: number, lat: number, zoom: number) {
    this.map.flyTo({ center: [lon, lat], zoom, duration: 1200, essential: true });
  }
}
