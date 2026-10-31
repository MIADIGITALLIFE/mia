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

## Progress on the feature branch

### Completed

- Added `i18n/locale.js`, a small shared locale-routing utility.
- Locale normalization supports `en`, `zh`, and regional tags such as `zh-CN`.
- Locale resolution is deterministic: explicit `?lang=` first, then a locale path segment, then the planned English default.
- URL mapping preserves the complete query string and hash, so current space/story/chapter parameters are not discarded.
- The helper does not translate page content and is intentionally not wired into the production shell yet.

### Not yet implemented or verified

- No English space pages or complete English dynamic-content translations exist yet.
- The visible language switch is intentionally deferred until it can lead to a complete same-language experience.
- Root default, `/zh/` production routing, iframe locale propagation, localized PWA metadata, and locale-separated service-worker caches remain pending.
- No production URL has been changed; this branch has not been merged or deployed.

### Locale utility contract

Load `i18n/locale.js` only after a page is ready to render a complete locale. Its public API is `window.MiaI18n`:

- `resolveLocale(locationLike?)`
- `localeFromPath(pathname)`
- `normalizeLocale(value)`
- `withLocale(urlLike, locale, basePath?)`

For GitHub Pages project hosting, pass `/mia/` as the base path when constructing cross-locale routes. Do not use root-absolute asset paths that escape the `/mia/` project prefix.

## Locale landing milestone

### Added on the feature branch

- `en/index.html`: a fully English Mist landing page, retaining the quiet dark visual direction, responsive layout, time-sensitive welcome line, and upper-right Chinese switch.
- `zh/index.html`: a Simplified Chinese Mist landing page with the matching visual composition and upper-right English switch.
- `en/world.html`: an explicit English-language boundary page for spaces that have not yet been translated. It preserves the requested query string and hash when offering the Chinese edition; it does not silently embed Chinese content into the English edition.

### Scope and limitations

- These are locale preview routes under `/en/` and `/zh/`; the production root route is intentionally unchanged.
- The English landing-page actions lead to the English boundary page until each destination space has a complete English translation.
- The Chinese landing-page actions continue to use the existing Chinese world shell.
- The full shared music shell, space-by-space translations, translated live feeds, root English default, and localized PWA setup are still pending.
- This milestone has been committed to the feature branch only. It has not been merged, deployed, or verified on GitHub Pages.


## English shell milestone

### Added on the feature branch

- Replaced the English placeholder shell at `en/world.html` with a locale-specific outer shell based on the existing shared audio shell.
- Preserved the existing audio ownership coordination, BroadcastChannel behavior, synthesized soundscapes, rain audio controls, album messages, and shared player interactions.
- Adjusted the original background-music asset path for the `/en/` directory.
- Added an upper-right Chinese switch in the English shell. It carries the current query parameters and URL hash into the Chinese shell.
- Added `en/unavailable.html` as an English-only boundary state for rooms that do not yet have English translations. It identifies the requested room and carries route state when opening the Chinese edition.
- Updated the English landing-page room links to open the top-level English shell rather than navigating the iframe into a nested shell.

### Current route behavior

- `/en/` opens the English Mist landing page.
- `/en/world.html` opens the English shell and its shared music controls.
- English requests for rooms such as `bar`, `music`, `greenhouse`, `archive`, `zhi`, `time-capsule`, and `stories` currently open the English unavailable state. They do not fall through to Chinese room pages.
- The English shell's language switch opens the existing Chinese root shell while preserving query parameters and the hash.

### Not yet verified / remaining

- The English shell has been committed, but browser-level playback, mobile layout, iframe messaging, and cross-tab audio ownership have not yet been tested in a deployed Pages environment.
- Individual English room pages and localized dynamic feeds are still pending.
- The Chinese edition has not yet been moved to a fully independent `/zh/world.html` shell.
- Root default remains unchanged. No production deployment or merge is claimed.


## English Bar room milestone

### Added on the feature branch

- Added `en/bar.html` as the first translated English room.
- Recreated the Bar's visual hierarchy and responsive layout in English while retaining its quiet amber palette, typography, echo animation, and 500-character input limit.
- Translated the philosophy cards and the curated Echo Collection.
- Kept the Echo Mailbox front-end only: text is neither transmitted nor persisted, and is cleared after the interaction.
- The English Bar uses its own English copy and does not load the Chinese shared `content.js` feed. This prevents Chinese daily-philosophy or visitor-wall content from leaking into the English edition when no approved English feed exists.
- Updated the English shell so `?space=bar` loads `en/bar.html`; other untranslated rooms continue to show the English boundary page.

### Remaining for the Bar

- A dedicated English dynamic-content source for daily philosophy and future curated echoes is not yet connected.
- PWA metadata and service-worker behavior are not yet localized for the English route.
- Browser-level visual, form, keyboard, and mobile checks on the deployed Pages site remain pending.
