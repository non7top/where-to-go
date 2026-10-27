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

## Phase 7c: Feedback round (FR-002, FR-003, FR-024, FR-025)

- [x] T025 Wind: `WS2M` fetched per point into `climate.json` (`wind`), `src/lib/feel.ts` felt high (0.7C per m/s above 3 m/s, floor 22C, warm days only), green band extended to 26C; legend and panel show the felt value. Checked: Nha Trang December and January green, Pattaya December yellow-green only (29C, about 4 m/s wind)
- [x] T026 Month ring bar: selected month centered, range from today tinted, today marked, drag by steps, `src/lib/timeuntil.ts` days-or-months label (45 day limit); unit tests
- [x] T027 Prominent country borders layer; nationwide events (`country`) listed in every area of the country; star highlights (`highlights`) with hover name and card list; Songkran made nationwide with four stars

## Phase 7d: Time control, green places and events (FR-002, FR-026, FR-027)

- [x] T028 Continuous year dial: `src/lib/season.ts` (day of year, interpolation between months, peak and spread), `src/ui/dial.ts` (drum) and `src/ui/ring.ts` (ring), switch button remembered in localStorage, days-or-months label (`src/lib/timeuntil.ts`); seasons marked and the strip colored from the selected area or the map center (`yearColors`). Checked in a browser: both looks, switching, selection driving the band, Escape closing the selection
- [x] T029 Green places panel (`src/lib/best.ts`, `src/ui/picks.ts`): cities and regions in the green range grouped by country with flag images, best first, plus the events of the period; Best button on narrow screens. Checked in a browser at 1280 px; the narrow-screen layout is not rechecked
- [x] T030 Events as peak plus spread, with fronts for sakura and momiji (Japan, Korea, China); events researched for end of 2026 and 2027 (book fairs, trade and anime fairs, music festivals, Hong Kong dragon boat festival); Wikipedia and official links with `scripts/check-links.mjs` (45 links checked, 4 dead ones removed; one official link answers 403 to scripts but exists)
- [x] T031 Standalone `file://` build and narrow screens rechecked. Standalone: renders fully, with no errors, in a sandboxed frame (opaque origin, the same conditions as file://); a `history.replaceState` error and a late-stylesheet map size problem found and fixed. Not observed: a real file:// page in a real browser (the headless Chromium here shows no map even over http, so it cannot tell). Phone width (390 px): drum and ring dials, Best panel and area panel checked; the area name on the drum is truncated to fit

## Phase 7e: Feedback round: icons, ginkgo, right card, selection, search (FR-026 to FR-029)

- [x] T032 Per-event icons drawn in `src/map/icons.ts` (maple, ginkgo, sakura, book, note, drops, lantern, boat, snow, monitor, moon, grass, calendar, star, booth) used on the map, in lists, cards and search; `iconFor` default by category; ginkgo front added; local names and aliases per country for sakura, momiji and ginkgo
- [x] T033 Right card as two panels (`src/ui/picks.ts`): top 10 green places grouped by country, events five rows tall and scrolling, scroll position kept while the dial turns
- [x] T034 Region narrowing by rectangle (`src/lib/scope.ts`, `WeatherMap.initBoxSelect`): Select area button or Shift and drag, outline on the map, Zoom and Clear, Escape clears. Checked in a browser with synthetic pointer events (a real mouse drag and touch drag are not tried)
- [x] T036 Shanghai ginkgo: season mid-November to mid-December with the peak in the second half of November, six named spots as stars shown only when zoomed in (`detail`), fixed the highlight star sharing its image name with the festival icon; data tests in `tests/data.test.ts`
- [x] T037 Map icons as grids (`src/lib/stack.ts`, four per row, merged when grids would overlap, "more" cell) instead of "+" cluster bubbles; hover previews from the right card (place outline, event halo). Checked with a real mouse in headless Chromium: 22 icons with no overlapping pairs, halo on hover and cleared after
- [x] T035 Global search (`src/lib/search.ts`, `src/ui/search.ts`): places, airport codes, events, local names and aliases; "/" focuses it. Checked in a browser at desktop and 390 px widths

## Phase 8: Hosting and checks

- [ ] T020 `.github/workflows/pages.yml` (build in container, deploy `dist/`); run with `act` before any real run. Workflow written and passes actionlint; Ran `act push -j build --bind` with `--container-options "-u <uid>:<gid> --group-add <docker socket gid>"`: checkout, install and build all succeed and the dist archive is created, no root-owned files left. The final artifact upload fails inside act ("unknown field mime_type" from act's local artifact server, which does not support this upload-artifact version), so the upload and the deploy job are untested until a real run. Nothing has been pushed.
- [ ] T021 Run the `quickstart.md` scenarios in a browser, record results in the final report. Checked in a browser: slider and month change, rain marks, Busan vs Seoul zoom, shortcut menu, inset click to Okinawa, Ko Tao vs Phu Quoc in November, Seoul January night flag, Kyoto November panel and momiji card, Songkran hover in April and its absence in August, Escape closing the panel, Awa Odori and Comiket icons in August, Phuket (moderate), Ko Tao (heavy) and Phu Quoc (none) rain states in November, phone layout, dark palette, no requests to other hosts.
