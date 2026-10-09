# Bangladesh Earth Trend Detective

## Goal
Turn the Kids’ Game page into a short, colorful detective adventure for ages 7–12. Children will inspect illustrated “before” and “now” scenes, identify simple visual changes, collect stars and clue badges, and complete a final Bangladesh mission.

## Experience
- Open on a hand-drawn Bangladesh map with a junior detective and four large locations: Padma River, Sundarbans, Village, and Dhaka City.
- Let children enter any location, compare two friendly cartoon scenes, and answer by tapping large pictures or trend choices.
- Give immediate gentle feedback, sparkle celebrations, one Detective Star per correct answer, and one Clue Badge per completed location.
- Unlock a final mission after all four locations are complete. Children classify the four collected clues as increasing, decreasing, or staying similar, then receive the “Bangladesh Earth Detective” badge.
- Keep the full game playable in roughly 2–5 minutes, remember progress while the page stays open, and provide restart/home controls.

## Visual and language design
- Create original inline cartoon drawings: rivers, boats, mangroves, deer, fish, rice fields, farmer, pond, rain, Dhaka roads, traffic, trees, and buildings.
- Use cheerful Bengali-inspired colors, subtle paper texture, animated water/clouds/sun/sparkles, and a friendly detective character without frightening disaster imagery.
- Support both English and Bangla for every game label, instruction, response, reward, and accessibility label.
- Use large keyboard-accessible controls and preserve reduced-motion support and small-phone layouts.

## Data honesty
- Mark every scene as an **observation practice illustration**, not measured historical evidence.
- Use simple practice years only to teach comparison; make no claim that the pictured change occurred in the real location.
- Keep real NASA records and scientific claims outside this illustrated game.

## Technical details
- Add a focused game component with typed mission definitions, progress state, final-answer state, and reusable SVG scene pieces.
- Make it the main Kids’ Game experience while retaining the existing administrator-managed quiz below as an optional follow-up activity.
- Add semantic game tokens and motion styles to the existing design system instead of hardcoding colors in page code.
- Update the Kids page title and social description for the new game.

## Verification
- Play through all four missions and the final mission.
- Check wrong-answer retries, stars, badges, restart, English/Bangla switching, keyboard operation, reduced motion, and 360px/mobile rendering.
- Confirm the current build and browser console remain error-free.