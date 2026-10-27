# Tasks: Static Map Prototype

**Input**: Design documents in `/specs/001-static-map-prototype/`

**Format**: `[ID] [P?] [Story] Description`. `[P]` means it can run in parallel with other `[P]` tasks.

## Phase 1: Setup

- [ ] T001 Dockerfile (node:22-alpine, non-root, mode-1777 cache dirs), `compose.yaml` (service `app`, uid/gid from env, named volumes for node_modules and caches), `Makefile` (`install`, `data`, `dev`, `build`, `lint`, `test`)
- [ ] T002 `package.json`, `tsconfig.json`, `vite.config.ts` (base `/where-to-go/`), ESLint config, `.gitignore`
- [ ] T003 `index.html` and base stylesheet `src/ui/styles.css` with light and dark tokens

## Phase 2: Foundation (blocks all stories)

- [ ] T004 [P] Pure libs with unit tests: `src/lib/color.ts` (gradient), `src/lib/rain.ts` (level from mm), `src/lib/months.ts` (wrap, names), `src/lib/events.ts` (month filter), `src/lib/comfort.ts` (night-comfort flag); tests in `tests/`
- [ ] T005 `scripts/build-areas.mjs`: download Natural Earth into a fresh dir, filter to region, simplify with mapshaper, add island circles, write `public/data/areas.geojson`
- [ ] T006 `scripts/fetch-climate.mjs`: NASA POWER per area point, 2015-2024 monthly average, rain level, cost, overrides merge, country means, write `public/data/climate.json`
- [ ] T007 [P] Curated sources: `data-src/{overrides,costs,events,concerts,shortcuts,islands}.json`
- [ ] T008 `scripts/validate-data.mjs` against `contracts/*.schema.json`, wired into `make test`
- [ ] T009 `src/data/load.ts` (the single data-access seam, base-relative URLs)

## Phase 3: User Story 1 - Weather by month (P1)

- [ ] T010 `src/map/map.ts` and `src/map/layers.ts`: style in code, area fill layer, outline layer, feature-state recolor
- [ ] T011 `src/ui/slider.ts`: month slider with keyboard, bottom or side layout
- [ ] T012 `src/map/patterns.ts`: generated hatch images and the two rain layers
- [ ] T013 `src/ui/legend.ts`: gradient bar and rain samples

## Phase 4: User Story 2 - Zoom and zoom-cuts (P2)

- [ ] T014 Zoom ranges for country, province and island layers; hover highlight and name tooltip
- [ ] T015 `src/ui/shortcuts.ts` and reset control; `src/map/inset.ts` Okinawa inset following the month

## Phase 5: User Story 3 - Events (P3)

- [ ] T016 Event layer with category icons (generated images), clustering, hover summary, click card

## Phase 6: User Story 4 - Area panel (P4)

- [ ] T017 `src/ui/panel.ts`: weather, rain, cost tier, comfort rating, night-comfort flag, events list, updates on month change

## Phase 7: User Story 5 - Looks and access (P5)

- [ ] T018 Responsive layout, focus styles, keyboard paths, Escape handling, contrast pass in light and dark
- [ ] T019 Error state when data fails to load

## Phase 8: Hosting and checks

- [ ] T020 `.github/workflows/pages.yml` (build in container, deploy `dist/`); run with `act` before any real run
- [ ] T021 Run the `quickstart.md` scenarios in a browser, record results in the final report
