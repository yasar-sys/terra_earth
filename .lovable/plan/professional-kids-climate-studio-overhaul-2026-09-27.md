# Professional kids climate studio overhaul

## Goal
Transform `/kids` from a game-like screen into a calm, premium science-museum data experience while preserving every cached NASA record, statistical calculation, district/variable structure, saved favorite, and lesson answer flow.

## What will change
- Shorten the kids navigation label to “For Kids” / “শিশুদের জন্য”, replace the game icon, and keep all header controls on one line. Desktop keeps primary destinations visible; narrower screens use the existing menu for secondary destinations.
- Replace the current intro-first presentation with the useful district studio as the main experience, led by a refined bilingual title and concise evidence framing.
- Make the Bangladesh district map the primary visual anchor, with keyboard-operable districts, visible focus, smooth hover color, and a restrained selected-district glow. Keep the district dropdown for precise selection.
- Replace emoji variable labels with consistent line icons and a compact, horizontally scrollable tab treatment with an animated active underline.
- Recompose Earlier and Recent into matched evidence cards: Earlier is quieter and desaturated; Recent is clearer and subtly elevated. Add a gentle time-flow connector and a 400ms keyed cross-fade when the district or variable changes.
- Add a bilingual evidence sentence derived only from the existing Mann–Kendall significance, p-value, period, and Theil–Sen slope. When the fields are unavailable, show no generated claim.
- Clearly state statistically non-significant results in neutral language rather than implying a change from endpoint values.
- Restyle the observation question and the existing bonus questions as low-pressure knowledge checks, removing trophy, stars, score-pop, emoji, and celebratory game language without changing questions, answers, scoring, or saved attempt behavior.
- Reframe the uploaded character as an optional field guide: contextual district/variable copy, breathing-only idle motion, a restrained significant-trend response, and a minimize/restore control. Keep it in page flow so it cannot cover cards.
- Add lightweight IntersectionObserver section reveals, unified 200ms/400ms motion timing, and complete reduced-motion fallbacks.
- Tighten bilingual copy and make Bangla the initial language only when no saved language preference exists.

## Technical details
- Frontend-only edits in the kids route, district learning component, guide component, shared navigation copy, and semantic styles.
- Use existing Lucide icons, existing Button and Sheet controls, current design tokens, and current Fraunces/Inter fonts.
- No changes to climate data files, statistics, backend functions, database structure, quiz content, or authentication behavior.
- Validate at 360px, 768px, and 1280px, including keyboard map selection, no header wrapping, minimized guide, bilingual labels, and reduced motion.
