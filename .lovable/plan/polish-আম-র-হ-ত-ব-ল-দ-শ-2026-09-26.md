# Polish “আমার হাতে বাংলাদেশ”

## What will change
- Layer each of the four existing mission illustrations into foreground, middle, and background groups with lightweight pointer parallax and scene-specific ambient loops: Padma ripples and boats, Sundarbans foliage and bird, village rice/water-wheel/smoke, and Dhaka clouds and window shimmer.
- Preserve every mission answer, data lookup, score rule, and quiz question while improving feedback: subtle clue hints, a short glow/sparkle reveal, encouraging wrong-answer motion, and a brief celebration after success.
- Add an accessible sound toggle and synthesize a tiny sparkle chime in the browser only after a correct answer; no audio file or extra package is needed.
- Animate an earned star from the answer area toward the mission score, then bounce the score display as it updates.
- Add a short illustrated travel interstitial when entering or leaving mission locations, using the existing adventure-map framing.
- Give the detective clear idle, thinking, and celebration states.
- Polish quiz answer reveal, count-up score feedback, and positive performance-scaled completion celebrations without changing quiz content or scoring.

## Technical details
- Keep animation CSS/SVG-based and use React state only for visual timing, pointer depth, mute preference, and animation keys.
- Keep controls keyboard-accessible and retain reliable touch behavior at 360px width.
- Disable parallax and collapse all motion to near-instant changes under `prefers-reduced-motion` while preserving complete gameplay.
- Avoid persistent animation timers where CSS loops suffice; pause decorative movement where browser visibility and reduced-motion settings require it.

## Verification
- Play all four missions and the final mission; verify correct and incorrect feedback, star flight, counter update, sound toggle, and travel transitions.
- Complete the bonus quiz with both correct and incorrect answers and verify both completion celebration levels.
- Check desktop and 360px mobile layouts, keyboard controls, reduced-motion behavior, console errors, and the project build.
