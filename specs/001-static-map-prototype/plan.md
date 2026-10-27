# Implementation Plan: Static Map Prototype

**Branch**: `001-static-map-prototype` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-static-map-prototype/spec.md`

## Summary

A zoomable vector map of Southeast and East Asia, colored by monthly daytime comfort on a gradient, with a rain mark on top, event icons, an area panel and a month slider. Everything is static: a build-time data step turns public climate data and simplified boundaries into JSON files that ship with the site. The browser only renders; there are no runtime third-party calls.

## Technical Context

**Language/Version**: TypeScript 7.0, Node 22 for build and data scripts, ES2022 in the browser

**Primary Dependencies**: maplibre-gl 6.16 (rendering), vite 8.3 (build), vitest 5.0 (tests), mapshaper 0.7 (data step only). No UI framework.

**Storage**: Static JSON/GeoJSON files in `public/data/`, committed

**Testing**: vitest unit tests for the pure functions (color gradient, rain level, month wrap, event month coverage, night-comfort flag); schema validation of data files; manual and browser check of the built site

**Target Platform**: Modern evergreen browsers, desktop and phone, hosted on GitHub Pages under `/where-to-go/`

**Project Type**: Static web app

**Performance Goals**: month change recolors the map in under 0.3 s; first view usable in under 3 s on a home connection

**Constraints**: No runtime server or outside service; data under about 3 MB gzipped; no map labels that need hosted fonts

**Scale/Scope**: About 450 provincial areas plus 2 island areas, 12 months each, about 12 starter events

## Constitution Check

*GATE: passes before research and after design.*

| Principle | Status |
|-----------|--------|
| I. Static-First | Pass. Only static files; data read through one loader module (`src/data/load.ts`). |
| II. Weather Drives the Map | Pass. Color is daytime temperature only; rain, comfort rating, night flag and cost never change it. |
| III. Pure, Tested Scoring | Pass. Color, rain level, wrap and flag logic live in `src/lib/` as pure functions with unit tests. |
| IV. Plain, Bundled Data | Pass. JSON with committed schemas; basemap and areas bundled; no keys. The data step calls public APIs at build time only, and its output is committed. |
| V. Disposable, Non-Root Tooling | Pass. `compose.yaml` services run as the host uid/gid; `make` targets are the entry point. |

No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-static-map-prototype/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── areas.schema.json
│   ├── climate.schema.json
│   ├── events.schema.json
│   └── url-and-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
Dockerfile
compose.yaml
Makefile
package.json
vite.config.ts
tsconfig.json
index.html
data-src/
├── overrides.json        # curator overrides: temp offsets, rain level, comfort 5-1, heating/cooling notes
├── costs.json            # base cost tier per country, monthly deltas
├── events.json           # curated recurring events
├── concerts.json         # updatable dated events
├── shortcuts.json        # zoom-cut targets
└── islands.json          # tiny islands drawn as circles (Ko Tao, Phu Quoc)
scripts/
├── build-areas.mjs       # Natural Earth -> simplified areas.geojson
├── fetch-climate.mjs     # NASA POWER -> climate.json
└── validate-data.mjs
public/data/              # generated and curated output, committed
src/
├── main.ts
├── lib/                  # pure: color.ts, rain.ts, months.ts, events.ts, comfort.ts
├── data/load.ts          # the single data-access seam
├── map/                  # map.ts, layers.ts, patterns.ts, inset.ts
└── ui/                   # slider.ts, panel.ts, legend.ts, shortcuts.ts, styles.css
tests/
.github/workflows/pages.yml
```

**Structure Decision**: single static project at the repository root. Curated source data lives in `data-src/`, and generated and merged output in `public/data/`, so a backend can later serve the same JSON shapes.

## Key Decisions

- **Climate source**: NASA POWER monthly series (one request per point, 2015-2024), averaged by month, giving daytime high, night low and rainfall. It is derived from a reanalysis, so values can be a few degrees off (Seoul August comes out warmer than station data); `data-src/overrides.json` allows a per-area-month temperature offset. Accuracy is not a goal here.
- **Areas**: provinces from Natural Earth admin-1 for the region's countries, plus country polygons for the zoomed-out view, plus circles for tiny islands. Admin-1 gives Busan, Seoul, Okinawa, Hokkaido and Phuket without hand drawing.
- **Rendering**: one MapLibre map with a style built in code (no tiles, no glyphs). Colors and rain marks are set per area with feature state when the month changes. Rain marks use two generated hatch patterns drawn as extra fill layers over the color.
- **Okinawa inset**: a second small non-interactive map pinned in a corner, updated by the same month change.
- **Labels**: no text layers on the map (they need hosted fonts); names show on hover and in the panel.
- **Hosting**: Vite `base` is `/where-to-go/`, and the data loader builds URLs from `import.meta.env.BASE_URL`.
