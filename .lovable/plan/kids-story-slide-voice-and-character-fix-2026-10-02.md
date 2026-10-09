# Kids story slide, voice, and character fix

## What will change
- Replace the long stacked story with one true full-screen slide at a time; Previous/Next always swaps the visible scene on phone and desktop.
- Change the background with every slide using scene-specific framing, tint, and movement so the new location is immediately clear.
- Start each slide’s narration after navigation, with a replayable voice control and reliable cancellation before the next voice begins.
- Select the best available Bangla or English device voice, using a warmer youthful pitch and natural pace; fall back safely when a preferred voice is unavailable.
- Show a larger character on every slide and map each scene to a pose or mood such as waving, thinking, encouraging, or celebrating.
- Animate the character while speaking with body gestures, subtle lip movement, and mood effects such as laughter marks; stop these effects when speech ends.
- Keep captions, mute, evidence links, language switching, reduced-motion support, and the final quiz unchanged.

## Technical details
- Drive the experience from the active scene index instead of scroll visibility.
- Load browser voices asynchronously, prefer native Bengali voices for Bangla and high-quality English voices for English, and synchronize speaking state through utterance start/end/error events.
- Reuse the existing five transparent mascot poses and add scene mood metadata rather than introducing ungrounded characters or data.

## Verification
- Test all 14 slides with Next/Previous on 360px, 507px, and desktop.
- Verify every slide changes text, background, pose, and narration without overlap.
- Verify Bengali/English voice selection, replay, pause, mute, captions, evidence drawer, final quiz, keyboard use, and reduced motion.
