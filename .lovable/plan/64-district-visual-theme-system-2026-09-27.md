# 64-district visual theme system

## What will change
- Add one typed configuration entry for every Bangladesh district, each documenting its gradient, ambient motion, guide accent, and geographic rationale.
- Add a reusable, decorative theme layer with a small shared set of lightweight ambient effects such as river ripples, coastal waves, mist, crop sway, rain, drift, and urban glow.
- Apply the selected district theme around the existing learning studio and cross-fade it when the district changes.
- Add restrained accent treatments to the existing guide while preserving its supplied artwork, behavior, messages, minimize control, and evidence role.

## What will remain unchanged
- Cached NASA records, trend calculations, district and variable structures, comparison cards, favorites, observation checks, and Field Notebook behavior.
- The dark TerraBangla visual system and bilingual content.

## Technical details
- Keep all 64 definitions in one typed data module keyed by existing district IDs.
- Render ambient visuals from one shared component using parameterized CSS/SVG primitives; visuals remain `aria-hidden` and non-interactive.
- Use CSS custom properties derived from the trusted config to avoid generating utility classes at runtime.
- Disable ambient animation and make theme changes immediate under `prefers-reduced-motion`.
- Validate that all 64 district IDs have exactly one theme and no unknown keys.

## Verification
- Check every district theme can render without missing configuration.
- Test district switching, guide minimizing, map selection, comparison values, and favorites at 360px, 768px, and desktop widths.
- Confirm no horizontal overflow, no blocked controls, and no motion under reduced-motion settings.
