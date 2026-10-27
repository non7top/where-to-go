# Data Model: Static Map Prototype

All files are static JSON under `public/data/`, read only through `src/data/load.ts`. Months are numbered 1-12.

## Area (`areas.geojson`)

GeoJSON FeatureCollection. Feature properties:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique, stable (Natural Earth adm1 code, or `island-<slug>`, or `country-<iso2>`) |
| `name` | string | Display name |
| `level` | `"country"`, `"province"`, `"city"` or `"island"` | Drives zoom range |
| `iata` | string, cities only | Airport code or codes, e.g. `PUS` or `ICN/GMP` |
| `country` | string | ISO 3166-1 alpha-2 |
| `point` | [lon, lat] | Climate point used for the data (`[0, 0]` for countries, which hold a mean) |

The zoom range in which each level is drawn is a constant in the map code, not per-area data.

## Monthly climate (`climate.json`)

Object keyed by area `id`; each value:

| Field | Type | Notes |
|-------|------|-------|
| `hi` | number[12] | Typical daytime high in C |
| `lo` | number[12] | Typical night low in C |
| `rain` | number[12] | Monthly rainfall in mm |
| `wind` | number[12], optional | Mean wind speed in m/s; used to compute the felt daytime high |
| `rainLevel` | (0,1,2,3)[12] | Derived, or overridden |
| `cost` | (1,2,3)[12] | Cost tier, $ to $$$ |
| `comfort` | (1..5 or null)[12] | Optional subjective rating, 5 best |
| `heating`, `cooling` | `"yes"`, `"partial"`, `"no"`, or absent | Per area, typical accommodation |

Country areas hold the mean of their provinces. A month with no data is `null` in `hi`, `lo` and `rain`.

## Event (`events.json`, `concerts.json`)

| Field | Type | Notes |
|-------|------|-------|
| `id`, `name` | string | |
| `category` | `"festival"`, `"fair"`, `"seasonal"`, `"holiday"`, `"concert"` | |
| `lon`, `lat` | number | Icon position |
| `peaks` | `{ on: "MM-DD", spread: days }[]` | Peak dates; active when the 15-day section reaches peak plus or minus spread |
| `fronts` | array, optional | A season sweeping a country: `{ country, anchors: [[lat, "MM-DD"]], spread, minLat?, overrides?: [{ areaId, on, spread? }] }`; the peak per province follows latitude |
| `links` | `{ wiki?, official? }`, optional | https URLs, checked by `make` target `links` |
| `when` | string | Human text, e.g. "13-15 April" or "about mid-November" |
| `approx` | boolean | True for windows |
| `summary` | string | One line for hover |
| `details` | string | Text for the opened card |
| `crowd`, `price`, `perk` | string, optional | Separate, any may be absent |
| `areaId` | string, optional | Links to an area for the panel list |
| `country` | string, optional | ISO code; the event applies to every area of that country |
| `highlights` | array, optional | Main places for the event: `{ name, lon, lat, note?, on?, spread? }`, drawn as stars in their own window (default: the event's peaks) |

Concerts use the same shape and are kept in their own file so they can be replaced by a feed.

## Shortcut (`shortcuts.json`)

`{ id, name, lon, lat, zoom }`. The Okinawa inset uses the shortcut with `id: "okinawa"` as its view.

## Validation rules

- Every area id in `climate.json` exists in `areas.geojson`, and the reverse.
- Month arrays have length 12; `comfort` values are null or integers 1-5.
- Event `months` are integers 1-12; `lon` and `lat` are inside the region box.
