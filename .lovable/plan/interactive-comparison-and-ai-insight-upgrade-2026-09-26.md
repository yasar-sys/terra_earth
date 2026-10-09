# Interactive comparison and AI insight upgrade

## What will change

- Upgrade the comparison page into a clear two-district investigation workspace while preserving the existing one-district/two-variable mode.
- Add a student observation box. The student selects a district and variable, writes what they noticed, and receives a concise AI explanation grounded only in the app’s cached NASA series, Mann–Kendall result, Theil–Sen slope, confidence interval, period, units, and provenance.
- Clearly separate measured evidence from possible causes. The AI response will not calculate or alter scientific values, and it will say when the data cannot support the observation.
- Add a downloadable comparison PDF containing the selected districts/variables, date window, chart snapshot, statistical results, plain-language verdict, provenance, and AI explanation when one has been generated.
- Furnish the header and footer with stronger project identity, clear active-page navigation, a compact mobile menu, improved language control, and direct paths into Explore, Heatmap, Compare, Game, and Methods.
- Replace the flat page treatment with a restrained, interactive Earth-science atmosphere: multiple original Bangladesh/Earth-observation images, subtle crossfades/parallax, depth layers, and motion that automatically switches off for reduced-motion users.
- Keep every new label and state in English and Bangla, including AI errors, PDF export, mobile navigation, and student guidance.

## AI and data safeguards

- Use Lovable AI through a server-only function with `openai/gpt-6-astra`; the browser never receives credentials or the hidden prompt.
- Send only the selected cached statistics and the student’s text to the model.
- Require the answer to cite the displayed district, variable, period, slope, p-value, and significance status, distinguish correlation from causation, and suggest one relevant follow-up investigation.
- Preserve the student’s text on failures and show the gateway’s safe error message. No automatic retry for denied or invalid requests.

## PDF contents

- Branded cover/header and generation date.
- Selected comparison settings and visible chart.
- Both lines’ rate, confidence interval, Mann–Kendall result, p-value, sample count, and honest significance statement.
- Dataset names, source URLs, retrieval dates, and cache mode.
- Optional AI explanation labeled as an interpretation, never as a computed result.

## Technical details

- Add the AI SDK Responses integration as a TanStack server function and validate inputs before calling the model.
- Add a reusable student insight panel and report-export helper rather than duplicating behavior.
- Use `jsPDF` plus a captured chart/report section for client-side PDF download.
- Generate and bundle several project-specific bitmap images locally; no hotlinked imagery.
- Reuse existing design tokens, data loaders, statistical functions, language context, buttons, and chart components.
- Add route-specific metadata where needed and verify the comparison, AI response, PDF download, menu, language switch, reduced motion, and 360px layout in the live preview.

## Lovable Cloud

Lovable Cloud is now enabled for secure server-side AI calls. It also provides built-in database, storage, user logins, and server functions if future student accounts, saved investigations, or badges are added.
