# Kids comic scene and character polish

## What will change
- Create 14 original, cohesive comic illustrations—one unique image for each story scene—instead of reusing five backgrounds.
- Match every illustration to its exact scene: space signal, evidence guide, river delta, five observations, NDVI, land temperature, air temperature, sunlight, rainfall, endpoint warning, Mann–Kendall test, Theil–Sen rate, evidence journal, and final challenge.
- Keep the artwork explanatory only; all displayed climate values and claims continue to come from cached NASA evidence.
- Give every scene its own character movement profile, including distinct entrance, idle gesture, and speaking motion while keeping the character readable on phones and desktops.
- Remove the artificial mouth overlay, voice bars, floating symbols, circular orbit, glow halo, and other objects around the character’s head. Only the clean transparent character artwork will remain.
- Polish movement with subtle whole-character gestures that fit each scene, such as wave, lean, nod, inspect, point, steady breathing, and celebration; reduced-motion mode will remain still.
- Replace the single oscillator tone with a soft scene-matched ambient sound bed generated in the browser alongside narration, with clean fade-in/fade-out and no overlapping audio.
- Preload all 14 scene images and five character poses so slide changes remain smooth.

## Technical details
- Add a scene artwork map keyed by the existing 14 scene IDs and update the story model to reference unique scene images.
- Add scene-specific motion metadata and CSS keyframes without adding an animation library.
- Keep narration controls, mute, pause/replay, captions, evidence drawer, keyboard/swipe navigation, bilingual copy, and final quiz behavior unchanged.

## Verification
- Check all 14 scenes for unique artwork, unique motion, clean character silhouettes, and synchronized narration/ambience.
- Test desktop, 507px, and 360px layouts, including dark/light theme and reduced motion.
- Confirm there is no audio overlap, horizontal overflow, console error, runtime error, or build error.
