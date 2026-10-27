# where-to-go Constitution

## Core Principles

### I. Static-First
The app is a static site: HTML, JS, CSS and JSON served from GitHub Pages. No server runtime, database or account system exists unless a ratified spec requires one. Data is read through a single loader module, so a backend can later replace the JSON files without touching the UI.

### II. Weather Drives the Map
Monthly weather is the primary signal. Areas are colored by temperature band (blue below 15C, green about 17-23C, orange up to about 30C, red above), with rain and monsoon seasons marked on top and never blended into the color. Weather is defined per area, not per country: nearby areas (Busan and Seoul, Ko Tao and Phuket) MUST be able to differ. Flight time and interest tags are secondary. Cost is informational only ($, $$, $$$ per area per month).

### III. Pure, Tested Scoring
Everything that turns data and user input into a color, marker or filter result is a pure function with unit tests. Month wraparound (December to January) and seasons that span a year boundary MUST have test cases.

### IV. Plain, Bundled Data
Areas, climate, events and notes are plain JSON validated against a schema committed in the repo. The basemap is a bundled simplified vector map; accuracy is not a goal. The app makes no runtime third-party calls and holds no API keys. Content grows over time: a feature MAY ship the schema and a small seed, and the full list is not a blocker.

### V. Disposable, Non-Root Tooling
Builds, linters, tests and data scripts run in throwaway containers (`docker compose run --rm`), as the host uid/gid, with named volumes for caches. `make` targets (`dev`, `build`, `lint`, `test`, `data`) are the documented entry point. Everything MUST rebuild from the committed compose file, Dockerfile and Makefile with no manual setup.

## Constraints

- Hosting: GitHub Pages at `https://non7top.github.io/where-to-go/`, deployed by a GitHub Actions workflow. Asset and data URLs MUST be base-relative (`/where-to-go/`).
- The repo is public. Nothing private goes in: no real home airport, passport or personal travel details in data, tests, docs, commits or PR text.
- v1 geography is Southeast Asia and East Asia. Other regions are out of scope until a spec adds them.
- Events carry optional, separate crowd, price and perk fields. An event with only a note is valid.
- Visa and safety information is static hand-written notes per destination, with no passport logic.

## Development Workflow

- All work goes on a branch and through a pull request; nothing is pushed to `master`. Merging needs an explicit go-ahead.
- Update branches by rebasing, never with merge commits.
- Commits are atomic, stage explicit paths, and use Conventional Commits prefixes (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`).
- Order of work for a change: lint, commit, build, deploy and check, then tests.
- Workflows are run locally with `act` before the first real run.
- Code comments are rare and explain why, not what.

## Governance

This constitution supersedes other practices in this repo. Amendments are made by pull request, state the reason, and bump the version: MAJOR for removed or redefined principles, MINOR for a new principle or materially expanded guidance, PATCH for wording fixes. Every spec, plan and PR is checked against these principles, and any deviation is recorded and justified in the plan's complexity section.

**Version**: 1.0.0 | **Ratified**: 2026-10-27 | **Last Amended**: 2026-10-27
