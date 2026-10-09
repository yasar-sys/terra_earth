# TerraBangla neon-professional redesign and AI Evidence Lab

## Visual system
- Replace Fraunces with Space Grotesk for headings and keep Inter for body/UI; retain Noto Sans Bengali for Bangla readability.
- Define complete semantic dark and light token sets in the global stylesheet: near-black/off-white foundations, elevated surfaces, electric violet primary, cyan secondary, and unchanged scientific trend colors.
- Add a pre-paint theme initializer, sun/moon header control, OS preference fallback, and persisted local preference without a flash or hydration mismatch.
- Upgrade shared buttons, chips, fields, cards, navigation, dialogs, sheets, tooltips, focus rings, scrollbars, and glass panels so every existing route inherits the same tactile glow and contrast treatment.

## Page-wide visual polish
- Restyle Landing, Globe, Heatmap, Compare, Kids, district reports, About, Auth, Profile, Admin, errors, splash, footer, and mobile navigation without changing their content, data behavior, routes, or core component structure.
- Preserve all meaning-carrying visualization colors and chart semantics; only surrounding interface chrome changes.
- Add restrained hover outlines, active-navigation glow, selected Bangladesh marker emphasis, stronger section rhythm, and reduced-motion-safe CTA animation.
- Audit light and dark appearances at desktop and 360px mobile widths, including charts, globe controls, provenance surfaces, quiz states, mascot bubbles, and administrative forms.

## Interactive AI Evidence Lab
- Expand the existing saved chat route into a research-grade evidence workspace while retaining Google-only sign-in and URL-addressable conversation history.
- Add district, climate variable, and year-range controls plus a live evidence summary computed from cached NASA records.
- Send only those selections and the user’s question to the server; recompute Mann–Kendall, Theil–Sen, current value, significance, and provenance server-side before every AI response.
- Present the chat with the installed AI Elements primitives, TerraBangla identity, research prompts, evidence status, visible provenance, honest unavailable-data handling, and bilingual labels.
- Keep the AI explanatory only: no browser-supplied climate values and no invented statistics or causal claims.

## Verification
- Check all content routes have complete route-specific metadata.
- Run type checks, lint, and the full production build.
- Exercise theme persistence, both themes, globe/heatmap/compare interactions, the Evidence Lab, responsive layouts, downloads, and reduced motion in the browser.
