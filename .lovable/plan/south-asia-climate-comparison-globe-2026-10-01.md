# South Asia climate comparison globe

## Goal
Keep Bangladesh as the violet focal country, then let users compare its observed trends with other South Asian locations across NDVI, land-surface temperature, air temperature, solar radiation, and precipitation.

## What will be built
- Use `#7C6FF0` for Bangladesh’s globe fill, outline, label, and pulse.
- Add a bilingual South Asia comparison mode to the world globe without changing the existing Bangladesh district journey.
- Show pre-cached NASA-backed sample locations across India, Pakistan, Nepal, Bhutan, Sri Lanka, Maldives, Afghanistan, and Myanmar.
- Add variable and year/trend controls for all five existing climate variables.
- Calculate each location’s Mann–Kendall direction, Theil–Sen slope, significance, and similarity to Bangladesh from cached observations only.
- Make globe markers clickable, with a compact evidence panel showing period, observations, trend, similarity, and provenance.
- Clearly label these as representative sample locations—not national averages—and show “data unavailable” rather than filling gaps.
- Keep current scientific color ramps unchanged; violet remains a brand/focus color rather than a data value color.

## Data and honesty
- NASA POWER supplies air temperature, precipitation, and solar radiation.
- MODIS/ORNL DAAC supplies NDVI and land-surface temperature.
- Cache files include source URL, dataset ID, retrieval time, coordinates, annual observations, and mode.
- Similarity will compare normalized annual anomaly shape over overlapping years; it will never imply causation.
- A location with fewer than five overlapping observations will not receive a trend or similarity result.

## Technical details
- Add a standalone South Asia cache and client-safe analysis module.
- Extend the globe with a distinct comparison-marker layer and selected-location state.
- Add a reproducible fetch script so cached observations can be refreshed without changing UI code.
- Preserve reduced-motion behavior, keyboard alternatives, light/dark contrast, and mobile layout.
- Verify source URLs, data parsing, globe interaction, and responsive rendering.
