# Quickstart: Static Map Prototype

All commands run through containers; the host needs only Docker and make.

## Setup and run

```text
make install    # install npm dependencies into a named volume
make data       # regenerate public/data from Natural Earth and NASA POWER (optional; output is committed)
make dev        # dev server on http://localhost:5173/where-to-go/
make build      # production build into dist/
make preview    # serve dist/ on http://localhost:4173/where-to-go/
make lint
make test
```

## Validation scenarios

1. **Month colors (spec P1)**: open `#m=1`, then `#m=7`. Hokkaido is blue in January and green in July; Thailand is orange or red in both.
2. **Rain marks (P1)**: at `#m=7`, Seoul-area provinces carry a rain hatch; at `#m=2` they do not.
3. **Nearby areas differ (P2)**: zoom to Korea at `#m=7` and compare Busan and Seoul. Zoom to the Gulf of Thailand and compare Ko Tao, Phuket and Phu Quoc.
4. **Zoom-cuts (P2)**: choose Okinawa in the shortcut menu; the inset also shows Okinawa.
5. **Events (P3)**: `#m=4` shows Songkran; `#m=8` shows Awa Odori; hover and click each.
6. **Panel (P4)**: click Kyoto at `#m=11` and see momiji with its crowd and price note.
7. **Night flag (P4)**: with Korea marked as no typical heating, a cold-night month (January) shows the flag.
8. **Layout (P5)**: resize below 720 px and the slider moves to the side; tab through all controls.

## Expected checks

- `make test` passes, including data validation against `contracts/`.
- `make build` output has no requests to other hosts (check the network tab or `grep` the bundle for `http`).
