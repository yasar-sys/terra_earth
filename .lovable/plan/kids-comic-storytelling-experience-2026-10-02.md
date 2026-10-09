# Kids comic storytelling experience

## Goal
Replace the current `/kids` district studio and standalone quiz with an 8–12 minute interactive comic story based entirely on TerraBangla’s existing climate evidence. Children follow recurring characters through Bangladesh, hear bilingual narration and gentle sound effects, then answer a final quiz about the story.

## Story experience
- Open with a clear **Start story** screen so narration can begin legally after a user gesture.
- Tell one continuous five-chapter story across roughly 14 illustrated scenes:
  1. Meet the young explorers and TerraBangla evidence guide.
  2. Travel from the globe into Bangladesh.
  3. Visit representative districts and discover vegetation, land temperature, air temperature, sunlight, and rainfall.
  4. Learn why one hot year or two different endpoints do not prove a trend, using Mann–Kendall significance and Theil–Sen rate in child-friendly language.
  5. Return with an evidence-first conclusion and prepare for the final review.
- Use original comic characters and scenes inspired by the reference site’s scrollytelling structure, without copying its text or artwork.
- Keep the supplied detective character as a calm evidence guide; add two original student characters and a small satellite companion for dialogue and visual continuity.
- Use scroll-triggered scene changes on desktop and mobile, plus visible Previous/Next controls and keyboard navigation so progress never depends on scrolling alone.
- Show a chapter label and progress indicator throughout the story, and remember the current scene during the browser session.

## Evidence and content rules
- Derive every displayed climate value and trend claim from the existing cached NASA district records and deterministic analysis helpers.
- Use selected representative districts only where all required cached evidence exists; identify each district, variable, period, dataset, and significance status.
- Treat illustrations as explanatory comic art, never measured evidence, and keep that distinction visible.
- Add a contextual **View evidence** control on relevant scenes. It opens the existing provenance panel and pauses narration.
- If a record is unavailable, show the existing honest “Data not yet available” message instead of inventing a value.

## Narration and sound
- Provide complete Bangla and English narration matching the selected language; visible captions remain on screen at all times.
- Use browser-supported speech narration so the public story works without exposing keys or generating content dynamically; gracefully keep captions usable when a device lacks a suitable voice.
- Add subtle original ambient effects through the browser audio system: wind, rain, river, city, forest, and satellite tones. No external copyrighted audio.
- Include persistent Play/Pause, Replay scene, Mute, and captions controls. Opening evidence or changing language stops the active voice cleanly.
- Never autoplay before Start, never overlap narration and effects, and disable nonessential motion/audio under relevant accessibility preferences.

## Final story quiz
- Remove the current generic climate quiz from the main experience.
- Unlock one final 6–8 question review only after the story, using facts and reasoning explicitly taught in its scenes.
- Include immediate feedback, the correct answer, and a short “What you learned” explanation after every response.
- Keep scoring calm and educational rather than game-like; offer Review story and Try again actions.
- Preserve optional signed-in saving through the existing owner-scoped learning-attempt pattern, with correctness recomputed from cached evidence where questions involve climate records.

## Visual direction
- Build a cinematic comic layout with full-viewport illustrated scenes, readable dialogue/caption panels, restrained speech bubbles, scene crossfades, and gentle character motion.
- Generate a cohesive set of original scene artwork that matches TerraBangla’s neon-professional violet/cyan system while remaining warm and age-appropriate.
- Reuse district atmosphere themes where useful, but keep comic art visually separate from scientific charts and labels.
- Support genuine light/dark themes, Bangla typography, 360px phones, landscape screens, and `prefers-reduced-motion`.

## Technical changes
- Create a data-driven story model containing chapters, bilingual dialogue/narration, evidence references, characters, and sound cues.
- Create focused story components for scene rendering, playback controls, evidence access, progress, and the final review.
- Replace the current `/kids` composition while preserving its route, language behavior, navigation, metadata, authentication, cached data, and existing server-side evidence protections.
- Reuse the existing mascot assets, provenance component, climate analysis helpers, semantic tokens, and design-system controls.
- Add generated illustrations through the project asset flow and add only the styles needed for this experience.
- Record the new children’s-story architecture in `AGENTS.md` and update `roadmap.md`.

## Verification
- Play the entire story in Bangla and English, including narration, pause/replay/mute, evidence panels, chapter progress, refresh recovery, and final quiz.
- Confirm every numerical statement against the source cache and deterministic analysis output.
- Test mouse, touch, keyboard, reduced motion, light/dark mode, and 360px/507px/1280px layouts.
- Confirm no overlapping text or controls, no trapped scrolling, no audio overlap, and no console, runtime, or build errors.
