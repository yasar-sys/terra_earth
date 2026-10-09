# Minimal animated learning and student profiles

## Goal
Replace the game-heavy `/kids` experience with a calm, minimal animated climate lesson for every Bangladesh district, and add a signed-in student profile that saves learning activity.

## Animated district lesson
- Keep the bilingual “আমার হাতে বাংলাদেশ / Bangladesh in My Hands” identity, but remove missions, stars, detective-game progression, sound effects, clue hunting, and game-map mechanics.
- Begin with a short illustrated intro featuring friendly student-guide characters, then show a 64-district selector and Bangladesh district map.
- For the selected district, use only its cached NASA record to show an animated “earlier” and “recent” state, years, values, unit, trend direction, and source. If data is unavailable, show the existing honest no-data message.
- Let learners switch among available vegetation, land temperature, air temperature, rainfall, and sunlight records.
- Follow each comparison with one simple trend question derived from the displayed record. Keep feedback encouraging and add a restrained animated outro after completion.
- Preserve the existing administrator-managed bonus quiz and its questions below the district lesson.
- Use subtle CSS/SVG motion, educational characters, touch-friendly controls, bilingual labels, and reduced-motion fallbacks.

## Student profile and saved learning
- Add a protected Profile page available from the signed-in account area.
- Let students edit display name, profile picture, school, class, home district, preferred language, and learning interests.
- Store profile pictures in private user-owned storage and display the Google picture until a custom one is uploaded.
- Let signed-in students save district favorites, district-lesson quiz results, and generated AI explanations; signed-out visitors can still learn but are invited to sign in before saving.
- Show saved districts, recent quiz results, and saved AI explanations on the Profile page with remove controls where appropriate.

## Data and security
- Add separate user-owned records for profiles, quiz attempts, favorite districts, and saved AI explanations.
- Enforce ownership in the backend so each student can only view or change their own records; do not store roles in profiles.
- Recompute and validate district/variable facts on the server for saved AI explanations rather than trusting values supplied by the browser.
- Keep Google as the only sign-in method and preserve the existing protected-route behavior.

## Technical details
- Use authenticated server functions for profile reads/writes, quiz-result saves, favorites, and AI explanation saves.
- Add a private profile-picture bucket with per-user file paths and access rules.
- Add a small account/profile affordance to the existing header without changing the public navigation structure.
- Update route metadata for the revised learning page and the new Profile page.
- Record the new learning/profile architecture in `AGENTS.md` and update the roadmap.

## Verification
- Test district selection and variable switching for multiple districts, honest no-data handling, correct quiz derivation, intro/outro, Bangla/English, 360px touch use, and reduced motion.
- Test signed-out save prompts and signed-in profile editing, picture upload, favorites, quiz history, AI explanation saving/removal, and cross-user isolation.
- Confirm type checks, current build, browser console, and backend security checks are clean.
