# Mia bilingual implementation contract

## Product requirement

- The root Pages URL is the English experience by default.
- The Chinese experience has a stable, explicit route under `/zh/`.
- A visible language control is available at the upper-right on desktop and mobile.
- Switching language preserves the current space, story identifier, chapter, and other supported route state.
- A page must render in one language only. No automatic browser translation and no mixed-language interface.
- Existing visual design, original nine photographs, audio, animation, time-capsule behavior, story archive, reading progress, ZHI content, responsive layout, and PWA behavior must remain intact.

## Repository audit (main branch)

Current site is a single-level static Pages application. The shell is `world.html`, which loads individual spaces in an iframe. The landing page is `index.html`. The current pages declare `zh-CN` and contain Chinese interface copy:

- `index.html` — welcome / Mist
- `world.html` — iframe shell and shared audio player
- `bar.html` — bar / daily reflection
- `greenhouse.html` — greenhouse
- `archive.html` — archive
- `time-capsule.html` — time capsule
- `music.html` — music room
- `zhi.html` — ZHI notes
- `stories.html` and `story.html` — story list and reader
- `content.js` — shared dynamic copy and UI behavior
- `content.json`, `mia-daily.js`, `time-capsule-data.json`, `data/stories.json` — content/data sources
- `manifest.json` and `sw.js` — PWA metadata and cache behavior

Assets (including the original nine photographs and audio files) remain shared and are not to be duplicated or renamed.

## Implementation architecture

1. Keep shared assets and behavior in the repository root.
2. Add a Chinese route at `/zh/`; keep the root route as English after the English experience passes acceptance checks.
3. Treat `world.html` as the language-aware shell. It must pass the selected locale into the iframe and preserve `space` and story route parameters when switching.
4. Keep language copy in explicit locale resources (English and Simplified Chinese). Do not use browser auto-translation or infer language from the user's browser.
5. Keep content identity and timestamps language-neutral. Localized display fields may be added alongside existing fields; never replace original story text or overwrite immutable timestamps.
6. Dynamic feeds must not silently fall back to the other language. If a translation is unavailable, show a clear same-language unavailable state rather than Chinese text in English mode or vice versa.
7. Update PWA names, descriptions, start URLs, and service-worker cache strategy for both routes without allowing one locale's cached shell to replace the other.

## Required acceptance checks

- Root entry and every reachable space are English-only.
- `/zh/` entry and every reachable space are Simplified-Chinese-only.
- Language switching preserves the current space and story/chapter route.
- Audio state, audio ownership, time-capsule data, story timestamps, reading progress, and all existing interactions are unchanged.
- Mobile navigation and language control remain usable at narrow widths.
- Both PWA entry points load the correct locale.
- Existing URLs continue to resolve or receive a deliberate compatibility redirect.

## Delivery discipline

Implement in small pull requests. Do not switch the production root to English until all reachable spaces and dynamic content have passed the acceptance checks. This branch establishes the audit and contract only; it does not claim that the site is already bilingual.
