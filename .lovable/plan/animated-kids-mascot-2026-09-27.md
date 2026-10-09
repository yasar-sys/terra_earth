# Animated Kids Mascot

## What will change
- Split the uploaded transparent character sheet into five optimized pose images: idle, celebrating, thinking, waving, and encouraging.
- Add a compact mascot overlay to `/kids`, positioned at the lower corner without covering lesson controls at desktop or 360px mobile widths.
- Show a bilingual speech bubble matching the current mascot state.
- Connect mascot reactions to both the district lesson and bonus quiz: wave on entry, think during transitions, celebrate correct answers/completion, encourage incorrect answers, then return to idle.
- Preload all pose images so reactions switch without flicker.
- Add gentle CSS motion, instant reduced-motion state changes, and automatic reaction timing.
- Make the selected Kids navigation item use a fully filled active button treatment rather than only an underline.

## Pose mapping
- Top-left: idle
- Top-center: celebrating
- Top-right: thinking
- Bottom-left: waving
- Bottom-right: encouraging

## Technical details
- Crop each pose from the supplied PNG, trim transparent edges, and publish each as a CDN-backed app asset.
- Use a small shared mascot state controller in the Kids page so the district lesson and bonus quiz can trigger the same character.
- Use CSS keyframes for bob, bounce, sway, wave, and cross-fade; no new animation library.
- Keep all quiz questions, scoring, climate calculations, district data, and save behavior unchanged.

## Verification
- Test entry, correct/incorrect answer reactions, question transitions, and return-to-idle timing.
- Test at 360px and desktop widths, including reduced-motion mode.
- Confirm the mascot does not block interactive content and the project builds successfully.
