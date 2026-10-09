# TerraBangla reference hub and heatmap pillars

## What will change
- Add a bilingual **Reference** item to desktop and mobile navigation, opening a dedicated page.
- Explain TerraBangla’s connection to the NASA Space Apps Challenge and the “Be An Earth System Trend Detective!” challenge.
- Add structured research and documentation sections using the project’s existing datasets, methods, README, and voiceover material.
- Reserve a polished video area for the team’s YouTube submission; until the URL is supplied, it will show a clear bilingual placeholder rather than a broken player.
- Restore the heatmap’s 3D data pillars while keeping the new South Asia country-name labels unchanged.

## Verification
- Check desktop and phone layouts, navigation, page metadata, keyboard access, and light/dark themes.
- Confirm the heatmap pillars render for all five supported variables without console or build errors.

## Technical details
- Use the existing TanStack route and shared site chrome patterns.
- Keep all climate values and claims grounded in cached records and existing deterministic methods.
- Store the eventual YouTube URL as one page-level constant so it can be replaced without changing the layout.
