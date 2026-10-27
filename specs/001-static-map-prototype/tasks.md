# Tasks: Static Map Prototype

**Input**: Design documents in `/specs/001-static-map-prototype/`

**Format**: `[ID] [P?] [Story] Description`. `[P]` means it can run in parallel with other `[P]` tasks.

## Phase 1: Setup

- [x] T001 Dockerfile (node:22-alpine, non-root, mode-1777 cache dirs), `compose.yaml` (service `app`, uid/gid from env, named volumes for node_modules and caches), `Makefile` (`install`, `data`, `dev`, `build`, `lint`, `test`)
- [x] T002 `package.json`, `tsconfig.json`, `vite.config.ts` (base `/where-to-go/`), ESLint config, `.gitignore`
- [x] T003 `index.html` and base stylesheet `src/ui/styles.css` with light and dark tokens

## Phase 2: Foundation (blocks all stories)

- [x] T004 [P] Pure libs with unit tests: `src/lib/color.ts` (gradient), `src/lib/rain.ts` (level from mm), `src/lib/months.ts` (wrap, names), `src/lib/events.ts` (month filter), `src/lib/comfort.ts` (night-comfort flag); tests in `tests/`
- [x] T005 `scripts/build-areas.mjs`: download Natural Earth into a fresh dir, filter to region, simplify with mapshaper, add island circles, write `public/data/areas.geojson`
- [x] T006 `scripts/fetch-climate.mjs`: NASA POWER per area point, 2015-2024 monthly average, rain level, cost, overrides merge, country means, write `public/data/climate.json`
- [x] T007 [P] Curated sources: `data-src/{overrides,costs,islands}.json` (generator inputs) and `public/data/{events,concerts,shortcuts}.json` (hand-edited, shipped as is)
- [x] T008 `scripts/validate-data.mjs` against `contracts/*.schema.json`, wired into `make test`
- [x] T009 `src/data/load.ts` (the single data-access seam, base-relative URLs)

## Phase 3: User Story 1 - Weather by month (P1)

- [x] T010 `src/map/map.ts`: style in code, area fill layer, outline layer, feature-state recolor
- [x] T011 `src/ui/slider.ts`: month slider with keyboard, bottom or side layout
- [x] T012 `src/map/patterns.ts`: generated hatch images and the two rain layers
- [x] T013 `src/ui/legend.ts`: gradient bar and rain samples

## Phase 4: User Story 2 - Zoom and zoom-cuts (P2)

- [x] T014 Zoom ranges for country, province and island layers; hover highlight and name tooltip
- [x] T015 `src/ui/shortcuts.ts` and reset control; Okinawa inset as a second non-interactive `WeatherMap` following the month

## Phase 5: User Story 3 - Events (P3)

- [x] T016 Event layer with category icons (generated images), clustering, hover summary, click card

## Phase 6: User Story 4 - Area panel (P4)

- [x] T017 `src/ui/panel.ts`: weather, rain, cost tier, comfort rating, night-comfort flag, events list, updates on month change

## Phase 7: User Story 5 - Looks and access (P5)

- [ ] T018 Responsive layout, focus styles, keyboard paths, Escape handling, contrast pass in light and dark. Done and checked in a browser: responsive layout (desktop and 390 px), month bar keyboard. Not yet checked: dark theme, Escape, tab order through all controls.
- [ ] T019 Error state when data fails to load. Code is in `src/main.ts`; not exercised yet.

## Phase 8: Hosting and checks

- [ ] T020 `.github/workflows/pages.yml` (build in container, deploy `dist/`); run with `act` before any real run. Workflow written and passes actionlint; `act` not run yet and nothing has been pushed.
- [ ] T021 Run the `quickstart.md` scenarios in a browser, record results in the final report. Checked in a browser: slider and month change, rain marks, Busan vs Seoul zoom, shortcut menu, inset click to Okinawa, Ko Tao vs Phu Quoc in November, Seoul January night flag, Kyoto November panel and momiji card, Songkran hover in April and its absence in August, Escape closing the panel, phone layout, no requests to other hosts. Not checked: Phuket in the island comparison, Awa Odori icon, Comiket, dark theme.
