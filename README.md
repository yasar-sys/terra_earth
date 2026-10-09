# MEC TERRA_DETECTORS

TERRA BANGLA — Bangladesh Trend Detective

Visit here : https://terrabangla.yasar.earth/

NASA Space Apps Challenge 2026 · Bangladesh · "Be An Earth System Trend Detective!"
Team: **MEC TERRA_DETECTORS** · License: Apache-2.0

An interactive 3D globe that flies into Bangladesh and reports real, statistically tested
climate trends for all 64 districts, a gridded heatmap, a trend comparison tool, and a
bilingual (English / বাংলা) kids' climate game.

## Science
- Mann-Kendall trend test (tie-corrected variance, continuity-corrected Z) and Theil-Sen slope
  with 95% CI. TypeScript: `src/lib/stats.ts`; Python reference: `scripts/backend/stats.py`.
- Biome label (Stable / Greening / Drying / Warming stress) is a deterministic rule set in
  `src/lib/biome.ts`. No LLM computes or invents any number or label.
- Offline-first: every number comes from cached files in `src/data/cache/` and `src/data/grid/`.
  Drop a new `<district>.json` into `src/data/cache/` and that district works with no code change.
  Districts without data show "Data not yet available" — nothing is fabricated.

## Backend (reference, FastAPI)
```
pip install fastapi uvicorn numpy scipy
OFFLINE=1 uvicorn scripts.backend.main:app
curl "localhost:8000/trend?district=dhaka&variable=temperature&start=2001&end=2024"
```

## Datasets
| Variable | Dataset | Source URL |
|---|---|---|
| Air temperature (T2M), solar radiation (ALLSKY_SFC_SW_DWN), precipitation (PRECTOTCORR) — per district | NASA POWER Monthly Point, AG community | https://power.larc.nasa.gov/api/temporal/monthly/point |
| Heatmap grids (T2M, PRECTOTCORR, ALLSKY_SFC_SW_DWN) | NASA POWER Monthly Regional (0.5°×0.625°) | https://power.larc.nasa.gov/api/temporal/monthly/regional |
| NDVI | MODIS MOD13Q1 v061 (250 m, 16-day) via ORNL DAAC | https://modis.ornl.gov/rst/api/v1 |
| Land surface temperature | MODIS MOD11A2 v061 (1 km, 8-day) via ORNL DAAC | https://modis.ornl.gov/rst/api/v1 |
| District boundaries | geoBoundaries BGD ADM2 | https://www.geoboundaries.org |
| Globe texture | NASA Blue Marble (via three-globe) | https://visibleearth.nasa.gov |

Planned: GPM IMERG (https://gpm.nasa.gov/data/imerg) and GRACE/GRACE-FO groundwater
(https://grace.jpl.nasa.gov) — not yet cached, so not shown.

## Refreshing data
```
python3 scripts/fetch_power.py        # 64 districts, POWER
python3 scripts/fetch_power_grid.py   # heatmap grids
python3 scripts/fetch_modis.py        # NDVI + LST (slow, chunked)
```

## Pitch voiceover
Video narration (English, 4 minutes) for the demo/pitch video:
- `docs/voiceover/TerraBangla_voiceover_240s_EN_final.md` — current presentation-ready
  240-second English script, with scene directions, timing windows, and recording notes.
- `docs/voiceover/TerraBangla_voiceover_EN_240s_meet_the_site.mp3` — final narration, TerraBangla
  speaks in first person; script with timing windows: `TerraBangla_voiceover_240s_EN_meet_the_site.md`.
- `docs/voiceover/TerraBangla_voiceover_EN_240s.mp3` — earlier documentary-style version;
  script: `TerraBangla_voiceover_240s_EN.md`.
- Feature walkthrough: `docs/TerraBangla_README.md`.

## Accessibility
Keyboard navigable, works at 360 px, respects `prefers-reduced-motion`, full English/Bangla toggle.

© 2026 MEC TERRA_DETECTORS · Apache-2.0
