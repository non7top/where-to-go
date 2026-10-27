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

- [ ] T018 Responsive layout, focus styles, keyboard paths, Escape handling, contrast pass in light and dark. Done and checked in a browser: responsive layout (desktop and 390 px), month bar keyboard, Escape closing the panel. Dark palette checked by applying the stylesheet's dark variables to the page (the browser tool could not switch the OS color-scheme preference, so the media-query switch itself is untested): panels, legend, month bar and map stay legible. Not checked: tab order through all controls.
- [x] T019 Error state when data fails to load. Checked by hiding `climate.json` from the served build: the page shows the message instead of a blank map.

## Phase 7b: Cities as the starting point (FR-023)

- [x] T022 `data-src/cities.json` (74 cities with airports, SEA and EA) and `scripts/build-areas.mjs`: city sectors as circles with `level: "city"` and `iata`; climate fetched per city center
- [x] T023 `src/lib/cities.ts` (menu grouping, lookup by any airport code) with unit tests; `src/ui/menu.ts` generic grouped menu; Cities button first in the top bar; `#c=<code>` start link
- [x] T024 City layer on the map (outlined circles from zoom 4) and airport code in panel and tooltip. Checked in a browser: Busan from the menu flies to its sector and opens the panel with its own weather

## Phase 8: Hosting and checks

- [ ] T020 `.github/workflows/pages.yml` (build in container, deploy `dist/`); run with `act` before any real run. Workflow written and passes actionlint; Ran `act push -j build --bind` with `--container-options "-u <uid>:<gid> --group-add <docker socket gid>"`: checkout, install and build all succeed and the dist archive is created, no root-owned files left. The final artifact upload fails inside act ("unknown field mime_type" from act's local artifact server, which does not support this upload-artifact version), so the upload and the deploy job are untested until a real run. Nothing has been pushed.
- [ ] T021 Run the `quickstart.md` scenarios in a browser, record results in the final report. Checked in a browser: slider and month change, rain marks, Busan vs Seoul zoom, shortcut menu, inset click to Okinawa, Ko Tao vs Phu Quoc in November, Seoul January night flag, Kyoto November panel and momiji card, Songkran hover in April and its absence in August, Escape closing the panel, Awa Odori and Comiket icons in August, Phuket (moderate), Ko Tao (heavy) and Phu Quoc (none) rain states in November, phone layout, dark palette, no requests to other hosts.
