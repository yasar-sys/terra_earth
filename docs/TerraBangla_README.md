# TerraBangla — Bangladesh Climate Trend Explorer

**Team: MEC TERRA_DETECTORS** · NASA Space Apps Challenge 2026, Bangladesh
Challenge: "Be An Earth System Trend Detective!" · License: Apache-2.0

TerraBangla is an interactive 3D web app that turns real NASA satellite data into
plain-language climate stories for all 64 districts of Bangladesh — in English and বাংলা.

## Presentation narration

The current presentation-ready English voiceover is available at
`docs/voiceover/TerraBangla_voiceover_240s_EN_final.md`. It includes a complete
240-second narration, matching screen directions, timing windows, and recording notes.

---

## What's inside the website

### 1. 3D Globe entry (Home)
- A rotating 3D Earth with Bangladesh highlighted and labelled.
- Click Bangladesh for a cinematic zoom into the country.
- All 64 districts become selectable; a compact district selector takes you to any district.

### 2. District pages (all 64 districts)
Each district page shows real, statistically tested trends:
- **NDVI (vegetation)** — MODIS MOD13Q1 satellite data
- **Land surface temperature** — MODIS MOD11A2 satellite data
- **Air temperature, solar radiation, rainfall** — NASA POWER (2001–2024)
- Every card shows: current value, unit, rate of change per decade, p-value,
  significance badge, mini trend chart, and Mann-Kendall trend result.
- **Biome verdict** — a deterministic label (Stable / Greening / Drying / Warming stress)
  with a one-paragraph plain-language explanation. No AI invents any number.
- **Provenance panel** on every chart: dataset ID, source URL, retrieval time.
- Districts without cached data honestly show "Data not yet available" — nothing is fabricated.

### 3. Real heatmap of Bangladesh
- A honeycomb grid of real NASA data cells (104 temperature/rainfall cells, 35 solar cells).
- Year slider (2001–2024) plus a per-decade trend view.
- Switch variables (temperature / rainfall / sunlight) and the map recomputes from real values.

### 4. Comparison tool
- Compare two districts on the same variable, or one district on two variables.
- Pick any start/end year window; each line gets its own Theil-Sen trend line,
  95% confidence band, p-value, and an honest verdict sentence.
- **Export the whole comparison as a PDF report.**
- **AI Evidence Lab**: students describe a trend they noticed; an AI coach suggests a
  data-backed explanation and a follow-up comparison — using only the computed statistics,
  never inventing numbers.

### 5. Kids' Climate Game (ages 8–14)
- Animated walkthroughs: why temperature is rising (greenhouse gases, deforestation,
  fossil fuels) and what we can do (tree planting, renewable energy, waste reduction).
- A quiz with instant feedback and one-line explanations, with score tracking.
- Fully bilingual: English + বাংলা.

### 6. AI Chat — "Ask TerraBangla"
- Signed-in users (Google) can chat with an AI climate assistant.
- Conversations are saved as multiple threads you can return to.

### 7. Admin panel
- Secured for the admin account (saminyasarsunny@gmail.com) via Google sign-in.
- Add new district data files, edit quiz questions, publish announcements,
  review chats, and manage data uploads.

### 8. Installable app (PWA)
- TerraBangla installs on phones and desktops like a native app, with its own icon.

### 9. Accessibility & honesty
- Fully keyboard accessible, works at 360px width, respects reduced-motion settings.
- Every UI string is bilingual (English / বাংলা toggle).
- All statistics computed by tested code (Mann-Kendall + Theil-Sen) — never by an AI model.

---

## Data sources
| Variable | Dataset | Source |
|---|---|---|
| Air temperature, solar radiation, rainfall | NASA POWER Monthly | https://power.larc.nasa.gov |
| NDVI (vegetation) | MODIS MOD13Q1 via ORNL DAAC | https://modis.ornl.gov |
| Land surface temperature | MODIS MOD11A2 via ORNL DAAC | https://modis.ornl.gov |
| District boundaries | geoBoundaries BGD ADM2 | https://www.geoboundaries.org |
| Globe texture | NASA Blue Marble | https://visibleearth.nasa.gov |
