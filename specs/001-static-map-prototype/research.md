# Research: Static Map Prototype

## Climate data source

- **Decision**: NASA POWER monthly point API (`temporal/monthly/point`), parameters `T2M` (monthly mean), `T2M_RANGE` (mean daily range) and `PRECTOTCORR` (rain), years 2015-2024, averaged per month. Typical daytime high is mean plus half the range, typical night low is mean minus half the range.
- **Rationale**: One small request per point with no key. `T2M_MAX` and `T2M_MIN` were tried first and rejected: they are the month's extremes, not typical values (for the Tokyo point, January `T2M_MAX` averaged 14.5C against 7.5C from mean plus half range, and `T2M_MAX - T2M_MIN` was about 19C against a mean daily range of 9.5C). The climatology endpoint has the same extremes problem (Seoul January minimum -21C).
- **Alternatives considered**: Open-Meteo archive (works, but daily data for about 550 points over several years risks the free daily call limit); hand-entered values (too slow for about 550 areas).
- **Caveat**: The source is a reanalysis on a coarse grid and the climate point is a label point, so values can be a few degrees off (the Tokyo point, in hills west of the city, runs cool). `data-src/overrides.json` allows a per-area-month offset. Accuracy is not a goal here.
- **Note**: The fetch script raises Node's per-address connect timeout (`net.setDefaultAutoSelectFamilyAttemptTimeout`) because the default 250 ms failed against this host from the container.

## Rain and monsoon mark

- **Decision**: Rain level 0-3 from monthly rainfall (mm): below 100 none, 100-170 light, 170-300 moderate, above 300 heavy. Marks draw for moderate and heavy. A curator override per area-month replaces the derived level.
- **Rationale**: Matches the clarified rule "derive from data, override by hand". Thresholds sit in one constant so they can be tuned.
- **Alternatives considered**: Rainy-day counts (not available from this source).

## Boundaries

- **Decision**: Natural Earth 10m admin-1 states and provinces and 50m admin-0 countries, filtered to Southeast and East Asia, simplified with mapshaper to about 1-2% of vertices.
- **Rationale**: Public domain, includes the named places, and simplification suits "accuracy is not needed". The admin-1 source file is about 40 MB, so the step runs in a container and only the simplified result is committed.
- **Alternatives considered**: Hand-drawn polygons (slow); geoBoundaries (not needed).

## Rendering

- **Decision**: maplibre-gl 6.16 with an in-code style: GeoJSON sources, fill and line layers, no raster or vector tiles, no text layers.
- **Rationale**: Vector zoom and pan, feature state for fast recolor, and no external dependency. Text layers need glyph files from a host, so names appear in hover and panel instead.
- **Alternatives considered**: Leaflet (weaker vector styling), D3 plus SVG (heavier at 450 polygons with zoom), hosted tile providers (rejected by the constitution).

## Rain pattern

- **Decision**: Two generated hatch images (diagonal lines, light and dense) added with `addImage`, each used by its own fill layer whose opacity is driven by feature state.
- **Rationale**: `fill-pattern` is not driven by feature state, but `fill-opacity` is. I have not confirmed this against the MapLibre 6 docs yet; the first build tests it, with a fallback of a per-area GeoJSON property.

## Versions checked on 2026-10-27

maplibre-gl 6.16.0, vite 8.3.5, vitest 5.0.5, typescript 7.0.2, mapshaper 0.7.98 (via `npm view` in a node:22-alpine container).

## Open items carried into the build

- Whether humidity should shift the color bands (dry heat such as Astana feels comfortable above 23C). Not in the prototype; the comfort rating covers it.
- Placement of the Okinawa inset on narrow screens (starts bottom-left above the slider).
