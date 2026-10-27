# UI Contract: Static Map Prototype

## Page

- Single page at the site base path (`/where-to-go/`). No routes.
- Data files are fetched from `<base>data/*.json|geojson`.

## State in the URL hash

`#m=<1-12>` selects the month, `#v=<lon>,<lat>,<zoom>` the view. Both optional. This is a prototype aid for reproducible screenshots and tests; the full shareable link is out of scope for this feature.

## Controls

| Control | Behavior |
|---------|----------|
| Month slider | 12 steps, labeled with month names; at the bottom when the viewport is at least 720 px wide, else at the side. Keyboard: arrow keys change month. |
| Shortcut menu | Button opens a list of places; choosing one flies the map there. |
| Reset | Returns to the full-region view. |
| Okinawa inset | Fixed small map, not interactive; follows the month. |
| Legend | Gradient bar with 10, 17, 23, 30 C ticks; hatch samples for moderate and heavy rain. |
| Area click | Opens the panel; area under the cursor highlights on hover with its name in a small tooltip. |
| Event icon | Hover shows a summary; click or tap opens a card; Escape closes the panel or card. |

## Panel (area)

Name, country, comfort color swatch with daytime high and night low, rain line, cost tier (`$`, `$$`, `$$$`), optional comfort rating (5 to 1), night-comfort flag when it applies, events for the month.
