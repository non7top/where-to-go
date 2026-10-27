# Feature Specification: Static Map Prototype

**Feature Branch**: `001-static-map-prototype`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Fully static map prototype with navigation, zoom, events and overall looks. Weather by month drives the map colors, with rain seasons marked, zoomable down to nearby areas that differ, and event icons. All data can be generated ahead of time."

## Clarifications

### Session 2026-10-27

- Q: What does the temperature in the color bands mean? -> A: Comfort for walking in a baseline outfit: jeans, t-shirt, hoodie and a light jacket or raincoat. Warm days with cooler nights are fine, and light rain is only marked, not penalized in the color. Reference points: early May in Japan, summer in Astana, spring and autumn in Baku count as comfortable.
- Q: How is the rain and monsoon mark decided? -> A: Derived from public rainfall data prepared ahead of time, with a hand override per area-month. In addition, each area-month can carry an optional subjective comfort rating from 5 to 1.
- Q: Gradient or discrete colors? -> A: Smooth gradient.
- Q: How are zoom-cuts presented? -> A: Both a shortcut list and a fixed inset for the main case (Okinawa).
- Q: Do cool nights and indoor comfort matter? -> A: Cool nights are acceptable for the color, but evening comfort in accommodation matters, and some regions have heating or air conditioning in typical rooms and others do not (the user's example: Korea generally has none). So each area carries a note on typical heating and cooling, and the panel flags nights that are cold or hot where that is missing.
- Q: Warm but windy days? -> A: Wind cools: the color uses a felt high, and green extends to 26C. Nha Trang in December and January should be green. Pattaya in December should be greenish more or less.
- Q: What should the month control show? -> A: The selected month centered, the stretch from the current month to it colored, and the time until it: days when within 45 days, months beyond.
- Q: Country borders and nationwide events? -> A: Country borders more prominent. Songkran is all of Thailand, with its main places highlighted by stars.
- Q: What should the time control look like? -> A: Like a disk seen from the side, not from the top, with both looks switchable. Smooth scrolling, a 15-day section, seasons marked, the strip colored by the climate at the map center or the selected area. Escape closes the selection.
- Q: How do events with dates work? -> A: Peak plus or minus 7 days per region, including hanami and momiji in Japan, Korea and maybe China. Events are researched for the end of 2026 and 2027 (music festivals, book fairs, trade and anime fairs, boat festivals), with Wikipedia and official links.
- Q: Right panel, icons, region and search? -> A: The right panel is two panels combined (top 10 places, events with five rows and scrolling). Better icons: a maple leaf for momiji and a blossom for sakura, plus ginkgo as its own season. Narrow by dragging a rectangle on the map. A global search bar. The autumn leaves have their own names in Korea (danpung 단풍, also hong'yeop 홍엽; the maple tree is danpungnamu 단풍나무) and China (hongye 红叶, traditional 紅葉).
- Q: Names of the seasons? -> A: Use the local name first, in the local script, and keep "momiji" and "hanami" only as aliases outside Japan, so Koreans and Chinese are not shown a Japanese word. Neutral names: Cherry blossom, Autumn leaves, Ginkgo leaves.
- Q: What is the main starting point? -> A: A list of main cities with airports (Busan, Seoul and so on), each the center of a region sector with its own weather. Picking a city is how a visitor starts: the map moves to its sector and opens its panel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the weather of the whole region by month (Priority: P1)

A visitor opens the page and sees a map of Southeast and East Asia. A month control lets them pick any month, and the map colors each area by how warm it is that month: bluish when cool, green when comfortable, orange when warm, red when hot. Rain and monsoon seasons show as a separate mark on top of the color, so a warm, comfortable but rainy area is still readable.

**Why this priority**: Weather by month is the main reason to use the app. Without it nothing else has meaning.

**Independent Test**: Open the page, move the month control from January to December, and check that colors and rain marks change for areas that are known to change (for example northern Japan between January and July).

**Acceptance Scenarios**:

1. **Given** the page just opened, **When** the visitor looks at the map, **Then** the current month is selected and areas are colored by temperature band, with a legend explaining colors and the rain mark.
2. **Given** any month is selected, **When** the visitor picks a different month, **Then** all area colors and rain marks update at once without a page reload.
3. **Given** an area is in its rainy or monsoon season in the selected month, **When** the map is shown, **Then** that area carries a rain mark that is visible on top of its temperature color.
4. **Given** an area is comfortable (about 17-23C) but rainy, **When** the visitor looks at it, **Then** it reads as green with a rain mark, not as a different color.

---

### User Story 2 - Zoom from the region down to nearby areas that differ (Priority: P2)

The visitor can zoom and pan the map. Coarse areas are shown when zoomed out, and finer areas appear as they zoom in, so places close together but with different weather can be told apart. Small places that would vanish at region scale, such as islands, can be reached directly through a shortcut that jumps to them at a useful zoom.

**Why this priority**: The user's key insight is that weather differs within a country and between close places. Without zoom the map is too coarse to be useful.

**Independent Test**: Zoom into Korea in July and check that Busan and Seoul can be distinguished and show different rain marks or colors. Use a shortcut to jump to Okinawa and see it at readable size.

**Acceptance Scenarios**:

1. **Given** the map is zoomed out, **When** the visitor zooms into a country, **Then** finer areas inside it appear and carry their own color and rain mark.
2. **Given** Ko Tao, Phuket and Phu Quoc are shown at fine zoom, **When** the visitor selects a month, **Then** each shows its own rainy season, which differ between the three.
3. **Given** the visitor opens the shortcut list, **When** they choose a small area such as Okinawa, **Then** the map moves and zooms to it and it is readable at that size.
4. **Given** the visitor has zoomed in, **When** they use a reset control, **Then** the map returns to the full-region view.

---

### User Story 3 - See events on the map for the chosen month (Priority: P3)

For the selected month, events appear as small icons on the map at their location. Each icon shows its category: festival, fair or convention, seasonal sight, national holiday, or concert. On a device with a pointer the visitor can hover to see a short description, and on any device they can click or tap to open the details. Events appear and disappear as the month changes.

**Why this priority**: Events change when and where someone wants to go (Songkran, Awa Odori, Comiket, autumn leaves, silver grass, Chuseok, Golden Week) but the trip is still judged on weather first.

**Independent Test**: Select April and see the Songkran icon in Thailand, select August and see the Awa Odori icon in Tokushima, then click each to open details.

**Acceptance Scenarios**:

1. **Given** a month is selected, **When** the map is shown, **Then** only events active in that month are shown, each as an icon of its category.
2. **Given** a pointer device, **When** the visitor hovers an event icon, **Then** a short summary appears; **When** they click or tap it, **Then** full details open and stay until dismissed.
3. **Given** an event whose date is a window (such as autumn leaves in November), **When** its details are shown, **Then** the window is stated as approximate.
4. **Given** several events lie close together, **When** the map is zoomed out, **Then** their icons are grouped, and **When** the visitor zooms in, **Then** they separate into individual icons.
5. **Given** an event has crowd, price or perk information (for example Chuseok has more tourists but free palace entry), **When** its details are shown, **Then** each piece is stated separately, and an event with only a note is shown with just that note.

---

### User Story 4 - Read an area's summary (Priority: P4)

Clicking an area opens a panel with its name, its weather for the selected month (color band, temperature range, rain status), its cost tier for that month shown as $, $$ or $$$, and the events in it that month. The panel makes quiet-but-cheap months readable, for example Japan in May or September.

**Why this priority**: The map answers "where", the panel answers "what is it like there then". It reuses the data already shown.

**Independent Test**: Click Kyoto in November and check that the panel shows its band, rain status, cost tier, and autumn leaves event with its crowd and price note.

**Acceptance Scenarios**:

1. **Given** an area is clicked, **When** the panel opens, **Then** it shows the area name, weather for the selected month, a cost tier for that month, and a list of that month's events in the area.
2. **Given** the panel is open, **When** the visitor changes the month, **Then** the panel content updates to the new month.
3. **Given** an area has no events that month, **When** the panel opens, **Then** it says so rather than showing an empty list.
4. **Given** an area where heating is not typical in accommodation, **When** the selected month has cold nights, **Then** the panel shows a night-comfort flag with the typical night temperature.

---

### User Story 5 - Comfortable looks on desktop and phone (Priority: P5)

The page looks finished: consistent colors, readable labels, and a layout that adapts to screen size. On a wide screen the month control is at the bottom; on a phone it is at the side so the map keeps most of the screen. All interactions work with touch, mouse and keyboard.

**Why this priority**: "Overall looks" was asked for explicitly, but it builds on the stories above.

**Independent Test**: Open the page at a phone-width screen and a desktop-width screen and complete the P1 test on both; then complete it using only the keyboard.

**Acceptance Scenarios**:

1. **Given** a screen narrower than a typical tablet, **When** the page loads, **Then** the month control is at the side and the map uses the remaining space.
2. **Given** a wide screen, **When** the page loads, **Then** the month control is at the bottom.
3. **Given** a visitor who uses only a keyboard, **When** they tab through the page, **Then** they can change the month, open the shortcut list and open an event or area panel.
4. **Given** a visitor who cannot tell colors apart, **When** they view the map, **Then** temperature bands are still distinguishable (for example by a numeric hint in the panel and legend).

---

### Edge Cases

- December to January wraps correctly, and a rainy season that spans a year boundary (such as November to February) shows in all its months.
- An area with no data for a month is shown in a neutral color and says "no data", not as a wrong color.
- Areas too small to see at region scale are still reachable (shortcut list).
- Event icons overlap at low zoom, so they group; touch devices have no hover, so details open on tap.
- An event window straddles two months and shows in both.
- The page is used on a slow connection, so the first view appears without waiting for all detail.
- The user's browser has scripts disabled or fails to load data: a clear message appears instead of a blank page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST show a zoomable, pannable map of Southeast Asia and East Asia.
- **FR-002**: The page MUST provide a continuous time control over the whole year, selecting a 15-day section (default: around today). It MUST come in two switchable looks, a drum seen from the side (default) and a ring seen from above, and remember the choice. The four seasons MUST be marked on it, and its season strip MUST be colored with the year's felt temperature for the selected area, or for the area at the center of the map when nothing is selected. A label MUST show the time until the section: days while within 45 days, otherwise months.
- **FR-003**: Each area MUST be colored for the selected month on a smooth gradient of the felt daytime high: bluish below 15C (colder is bluer), green from about 17 to 26C, then yellow, orange up to about 32C, and red above. The felt value is the typical daytime high reduced for wind on warm days, so a windy 26C reads as comfortable (Nha Trang in December and January). Cooler nights MUST NOT change the color.
- **FR-004**: Rain and monsoon seasons MUST be shown as a mark separate from the temperature color, and MUST NOT change the color. The mark is derived from public rainfall data prepared ahead of time, and a curator MUST be able to override it per area and month.
- **FR-005**: Weather MUST be defined per area, so nearby areas can differ; rain seasons MUST be per area.
- **FR-006**: Finer areas MUST appear as the visitor zooms in, and coarser areas MUST be shown when zoomed out.
- **FR-007**: The page MUST provide a shortcut list that jumps to small areas at a readable zoom, a fixed inset showing Okinawa at readable size, and a control to reset the view.
- **FR-008**: Events MUST be shown as category icons at their location, filtered by the selected month.
- **FR-009**: Event categories MUST include festival or main event, fair or convention, seasonal sight, national holiday, and concert.
- **FR-010**: Event details MUST open on hover (summary) and on click or tap (full details), and MUST be reachable without hover.
- **FR-011**: Events MUST support an exact date or an approximate window, and MUST show in every month they cover.
- **FR-012**: Each event MAY carry separate crowd, price and perk notes, and any of them MAY be absent.
- **FR-013**: Event icons that are close together MUST group at low zoom and separate at high zoom.
- **FR-014**: Selecting an area MUST open a panel with weather for the selected month, a cost tier ($, $$, $$$) for that month, and that month's events in the area.
- **FR-015**: The cost tier MUST be defined per area per month and be informational only; it MUST NOT affect map colors.
- **FR-016**: The page MUST include a legend explaining temperature colors and the rain mark.
- **FR-017**: The layout MUST place the month control at the bottom on wide screens and at the side on narrow screens.
- **FR-018**: All controls MUST work with touch, mouse and keyboard.
- **FR-019**: All map and event data MUST be produced ahead of time and shipped as static files; the running page MUST NOT need a server or any outside service.
- **FR-020**: Event data MUST be kept separately from area data, and concert data separately from the other events, so each can be updated on its own.
- **FR-021**: Each area-month MAY carry a subjective comfort rating from 5 (best) to 1, set by a curator, and the area panel MUST show it when present.
- **FR-022**: Each area MAY carry a note on typical heating and cooling in accommodation (available, partial, not typical). When the selected month has cold nights where heating is not typical, or hot nights where cooling is not typical, the area panel MUST flag it. This flag MUST NOT change the map color.
- **FR-024**: The area borders of each country MUST be drawn more prominently than province and city outlines at every zoom level.
- **FR-026**: A card on the right MUST combine two panels: the top 10 comfortable (green) places for the selected section, grouped by country with the country flag (as an image, since flag emoji do not render on Windows), and below it the events active in that section, always five rows tall and scrolling. It MUST give way to the area panel when one is open, and be opened from a Best button on narrow screens. The visitor MUST be able to narrow both lists to a region by dragging a rectangle on the map (a Select area button, or Shift and drag), see its outline, zoom to it and clear it; Escape clears it.
- **FR-027**: Events MUST carry a peak date and a spread in days (so a window is the peak plus or minus the spread) and MAY carry a front: a season that sweeps across a country, with the peak per area following latitude and overridable per area. Cherry blossom, autumn leaves and ginkgo MUST be modeled this way for Japan, Korea and China, with a spread of 7 days, and each country MUST show its own name for the season first, in its own script (for example 紅葉 in Japan, 단풍 in Korea, 红叶 in China), with the Japanese terms (momiji, hanami) only as search aliases outside Japan. An event MAY carry links to its Wikipedia page and its official site, shown in the event card; every link MUST be checked to resolve.
- **FR-030**: Event icons on the map MUST NOT pile up or collapse into unlabeled count bubbles. Icons that would overlap are grouped by screen distance and laid out as a grid, four to a row, one icon per event in a group, with a final "more" cell (click to zoom in) when a group holds more than eight; the grid is rebuilt as the map zooms. Hovering an event row in the right card MUST ring its icons on the map, and hovering a place row MUST outline that place.
- **FR-028**: A global search box MUST find places (by name, airport code or country) and events (by name, by the local names of a season in each country, and by alternative names). Choosing a place flies to it and opens its panel; choosing an event moves the time control to its next peak, flies to it and opens its card. The "/" key focuses the box.
- **FR-029**: Each event MUST show an icon that fits it (for example a maple leaf for autumn leaves, a ginkgo leaf for ginkgo, a blossom for cherry blossom, a book for book fairs, a music note for concerts), on the map, in lists and in cards.
- **FR-025**: An event MAY apply to a whole country, and then it MUST be listed in every area of that country. An event MAY carry highlight points (the main places to see it); for the selected month these MUST be shown on the map as stars with their name on hover, and listed in the event card.
- **FR-023**: The page MUST provide a Cities list as the main starting point. Each entry is a city with an airport, grouped by country, and is the center of a city sector with its own monthly weather. Choosing one MUST move the map to that sector and open its area panel, which shows the airport code. A start link MAY name a city by any of its airport codes.

### Key Entities *(include if feature involves data)*

- **Area**: A place on the map with a name, a parent area, a shape, a zoom range in which it shows, and an optional note on typical heating and cooling in accommodation. Has twelve monthly climate entries.
- **Monthly climate**: For one area and one month: temperature range, rain status, rain or monsoon mark, cost tier, and an optional comfort rating from 5 to 1.
- **Event**: A name, category, location, month coverage (exact date or approximate window), a short description, and optional crowd, price and perk notes.
- **City sector**: An area centered on a city with an airport: name, country, airport code or codes, center point and radius. Has its own twelve monthly climate entries. Listed in the Cities menu.
- **Shortcut**: A named jump target with a position and zoom, for small areas that vanish at region scale.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can tell which months are green (comfortable) for a named area, such as Seoul, within 30 seconds of opening the page.
- **SC-002**: Changing the month updates the whole map in under 0.3 seconds on a typical laptop and a mid-range phone.
- **SC-003**: The first view of the map is usable within 3 seconds on a typical home connection.
- **SC-004**: At least three pairs of nearby areas show different weather or rain marks in the same month (Busan and Seoul in July; Ko Tao, Phuket and Phu Quoc in the same month).
- **SC-005**: At least one starter event exists for each of the five event categories, and each opens its details on both hover/click and tap.
- **SC-006**: The page is fully usable at a screen width of 360 pixels with no sideways scrolling, and fully usable using only the keyboard.
- **SC-007**: Every starter area has data for all twelve months, or is explicitly marked as having none.

## Assumptions

- The first release is a prototype: starter content for a handful of areas and events, not complete coverage. More content is added later without changing the page.
- Starter areas include: Seoul, Busan, Kyoto, Tokyo, Hokkaido, Okinawa, Bangkok, Chiang Mai, Phuket, Ko Tao, Phu Quoc and Hanoi, with finer areas appearing as the visitor zooms in.
- Starter events include: Songkran, Awa Odori, Comiket, autumn leaves, silver grass festival, Chuseok, Golden Week and at least one concert.
- Weather values are approximate and hand-curated or generated ahead of time from public climate data; they do not need to be exact.
- The colors describe daytime comfort for walking in a baseline outfit (see Clarifications), so the 17-23C green band is a starting point. Dry heat such as summer in Astana may feel comfortable at higher temperatures; whether humidity shifts the bands is left for the plan, and the comfort rating covers such cases meanwhile.
- The comfort rating is optional curator data and does not change map colors in this release.
- Heating and cooling notes are hand-set by the curator from experience and may vary by place and hotel type; they are a hint, not a guarantee. The monthly climate therefore needs a typical night temperature as well as the daytime one.
- Where the starter data lacks a heating or cooling note, no flag is shown.
- The map need not be geographically precise; simplified outlines and rough area shapes are acceptable.
- The cost tier for each area-month is hand-set, and events only annotate it in this release.
- The page is in English only.
- Out of scope for this release: flight time and home location, interest tags, shortlist, shareable links, visa and safety notes, sightseeing lists, accounts, and any server or live data.
