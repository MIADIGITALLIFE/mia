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


## English Greenhouse room milestone

### Added on the feature branch

- Added `en/greenhouse.html` as an English-only translation of the Greenhouse experience.
- Preserved the greenhouse visual system, responsive layout, rain / light / breathing choices, animated light scene, 20-second optional pause, progress indicator, optional reflection, and end-or-skip controls.
- Rain playback continues to coordinate with the shared English shell through the existing `mia:rain-start` / `mia:rain-stop` messages. The standalone fallback remains available when the page is opened outside the shell.
- Optional memories retain the existing localStorage key and record shape (`mia-greenhouse-memories-v1`) so the existing Archive can recognize saved entries. Notes are stored only after an explicit save action and remain in the current browser.
- The English page does not load `content.js` or Chinese greenhouse copy. Its interface and prompts are English-only, apart from the intentional `中文` language switch.
- Updated `en/world.html` so `?space=greenhouse` opens the translated English room.

### Remaining for the Greenhouse

- Browser-level verification of rain audio, parent-shell message coordination, light animation, local memory persistence, and narrow-screen layout is still pending.
- Saved memory display in an English Archive is not yet implemented; the English Archive remains an untranslated-room boundary.
- The page has not been merged or deployed to GitHub Pages.


## English Archive room milestone

### Added on the feature branch

- Added `en/archive.html` with an English-only interface and the original nine gallery image assets, retaining their existing image files and order.
- Preserved the greenhouse-memory storage key and record schema (`mia-greenhouse-memories-v1`). The English Archive reads the same browser-local records created by the Chinese or English Greenhouse; it does not migrate, rewrite, or upload them.
- Preserved memory counts, latest-save date, filters (all / rain / light / breathing), individual memory cards, and the explicit clear-on-this-device action with confirmation.
- Added English-only gallery descriptions, reflection notes, empty states, date formatting, and copy feedback. The daily note card is local to the page and is not automatically saved.
- The page does not load Chinese `content.js` or Chinese dynamic content. Its only Chinese UI text is the intentional `中文` language switch.
- Updated `en/world.html` so `?space=archive` opens the translated English Archive.

### Remaining for the Archive

- Browser-level verification of the nine image asset paths, localStorage compatibility across the two language routes, filtering, clipboard permission handling, and mobile layout is still pending.
- Story Archive content remains a separate untranslated room; story bodies will retain their original language unless an approved translation exists.
- The page has not been merged or deployed to GitHub Pages.


## English Music Room milestone

### Added on the feature branch

- Added `en/music.html` as an English-only Music Room page with the existing restrained night-sky palette, serif typography, responsive navigation, and upper-right Chinese language switch.
- Recreated the six original album entries in English while retaining their exact source audio filenames; audio assets are referenced from the shared repository root and are not copied, renamed, or replaced.
- Preserved native audio controls, metadata preloading, one-audible-player behavior within the album, and the existing `mia-audio-owner-v1` / `mia-audio-v1` cross-tab ownership protocol.
- Preserved the `mia:album-play` and `mia:stop-album` parent-shell messages so album playback continues to coordinate with the English shared player.
- The English Music Room does not load Chinese `content.js`, `content.json`, or the Chinese music playlist. Its only Chinese interface text is the intentional `中文` language switch.
- Updated `en/world.html` so `?space=music` opens `en/music.html` rather than the untranslated-room boundary.

### Scope and verification limits

- The legacy Chinese Music Room currently exposes the original album through `mia-album.js`. The older three mood-synthesis choices are part of the shared shell/content integration and are not presented as separate selectable cards on this album page; no new mood controls or replacement audio have been invented in the English translation.
- Static review confirms that all six original filenames are retained, the English page uses the shared audio ownership key/channel and album messages, and the page does not import Chinese content scripts.
- Browser-level verification of audio file loading, playback, pause coordination with the shell, cross-tab ownership, keyboard controls, and mobile layout remains pending.
- This page is committed only to the bilingual feature branch. It has not been merged or deployed to GitHub Pages.


## English Time Capsule milestone

### Added on the feature branch

- Added `en/time-capsule.html` with an English-only interface, the existing amber visual language, responsive timeline layout, archive filters, date search, and upper-right Chinese language switch.
- The English page reads the existing root `time-capsule-data.json` directly. It does not copy, regenerate, translate in place, or modify the historical archive.
- Displays the number of four-dimension snapshots and daily-philosophy entries, grouped by preserved snapshot/date fields.
- Because the current archive records contain Chinese source text and no approved English translation fields, the English view deliberately does not render those Chinese titles, paragraphs, tags, or moods. Each record is identified as original Chinese source text and links to the Chinese Time Capsule.
- Preserves the distinction between historical snapshots and the live page; no current content is substituted when the archive cannot load.
- Updated `en/world.html` so `?space=time-capsule` opens the English archive index.

### Data integrity and limitations

- The current source data contains 10 four-dimension snapshots and 12 daily-philosophy entries (22 records in total at the time of implementation). Counts are read dynamically from the JSON and are not hard-coded.
- Historical text remains in its original language and remains unchanged. English translation of the archived content is a separate future content task; the English page does not imply that those translations exist.
- Static review confirms the English page reads the shared archive JSON, displays only English interface copy (apart from the intentional `中文` switch), and routes to the English Time Capsule.
- Browser-level verification of data loading, filters, date search, Chinese cross-link behavior, and mobile layout remains pending.
- This page is committed only to the bilingual feature branch. It has not been merged or deployed to GitHub Pages.


## English Story Archive milestone

### Added on the feature branch

- Added `en/stories.html`, an English-only story catalogue with translated interface copy, English category labels, responsive story cards, and the existing shared story catalogue data.
- Added `en/story.html`, an English reading-room interface with chapter navigation, reading progress, resume-reading support, and the same localStorage progress key (`mia-story-progress:<story-id>`) used by the Chinese reader.
- Both English pages read the existing `data/stories.json`; no story IDs, chapter arrays, source text, publication metadata, cover assets, or timestamps are rewritten.
- The current published story has an English title (`REVERSE ENLIGHTENMENT`) but no approved English chapter translation or chapter-title translations. The English reader therefore presents the original Chinese body as an explicitly labeled original-language edition; chapter navigation uses neutral numbered labels rather than leaking Chinese chapter headings into the English interface.
- Language switching from the reader preserves the story ID, query parameters, and chapter hash when opening the Chinese reader. The catalogue links to the existing Chinese catalogue.
- Updated `en/world.html` so `?space=stories` opens the English Story Archive catalogue.

### Data integrity and verification limits

- The current catalogue contains one published story with eight chapters. This count is read from the shared JSON, not hard-coded into the catalogue.
- The existing story timestamp is preserved as source data but is not presented as an exact publication time in the English catalogue; the displayed timestamp in the legacy record is a placeholder and should not be treated as a verified creation time.
- Static review confirms the English catalogue and reader use English interface copy, use the shared story data and cover asset, retain the original reading-progress key, and do not alter the source JSON.
- Browser-level verification of chapter navigation, resume progress across locales, URL hash restoration, cover loading, and mobile reading layout remains pending.
- These pages are committed only to the bilingual feature branch. They have not been merged or deployed to GitHub Pages.


## English ZHI Notes milestone

### Added on the feature branch

- Added `en/zhi.html` with an English-only four-dimension interface: Creation & Exploration, Reality & Decisions, Philosophical Experiments, and Growth & Everyday Life.
- Preserved the existing dark editorial visual direction, responsive four-dimension navigation, single-dimension deep links, and upper-right Chinese language switch.
- The page reads the established public `mia/sections.json` feed from the ZEE repository. It uses stable section IDs to match the four dimensions.
- The current public feed declares `language: zh-CN` and contains Chinese-only titles, tags, triggers, focus notes, and body content. The English page therefore does not render those fields or use Chinese content as a fallback.
- Added a forward-compatible localized-field contract: the English page will render `title_en`, `subtitle_en`, `tags_en`, `focus_en`, `content_en`, `mood_en`, and `trigger_en` only when supplied by the feed. Until approved English fields exist, each dimension displays an English translation-unavailable notice and a link to the matching Chinese section.
- Added an EN switch to the existing Chinese `zhi.html`; both directions preserve the `section` query parameter and URL hash.
- Updated `en/world.html` so `?space=zhi` opens the English ZHI Notes page.

### Data integrity and verification limits

- The existing public feed currently contains four published Chinese sections and no `sections-en.json` translation feed. No source feed, content, IDs, or timestamps were modified.
- The English page may display the feed's update date and count of approved English editions; it does not expose untranslated Chinese copy.
- Static review confirms the English page declares `lang=en`, contains English-only interface copy apart from the intentional `中文` switch, uses the public sections feed, and gates all dynamic text behind explicit English-suffixed fields.
- Browser-level verification of the live remote feed, section deep links, language switching, mobile layout, and future localized-field rendering remains pending.
- These changes are committed only to the bilingual feature branch. They have not been merged or deployed to GitHub Pages.


## Unified bilingual dynamic-content contract milestone

### Added on the feature branch

- Added `data/i18n/content.schema.json` (JSON Schema Draft 2020-12) to define stable content identity, source locale, provenance timestamps, immutable-history flag, and locale-specific payloads.
- Added `data/i18n/content.example.json` as an illustrative record. It is sample data, not a published Mia item or a translation.
- Added `data/i18n/README.md` to define locale payload lifecycle (`draft`, `in_review`, `approved`, `published`, `unavailable`), publication gates, story/chapter identity rules, and Time Capsule immutability.
- Added `scripts/validate-bilingual-content.mjs`, a dependency-free validation gate for normalized records. It rejects unsupported IDs/types/locales/statuses, invalid creation dates, published empty payloads, and published non-source translations without reviewer metadata.
- Updated `en/zhi.html` to accept the new `translations.en` payload when its status is `published`, while retaining compatibility with existing explicit `*_en` fields. It still refuses to display source-language text as an English translation.

### Data protection and current scope

- Existing `sections.json`, daily feeds, story JSON, and Time Capsule snapshots remain unchanged.
- No machine-generated English translation has been marked approved or published.
- The example record intentionally keeps its English payload in `draft` status.
- The validator is a focused contract checker, not a complete JSON Schema implementation. A full Draft 2020-12 validator should also run in the content CI pipeline before production use.
- The schema, example, validator, and ZHI adapter are committed only to the bilingual feature branch. No merge or production deployment is claimed.


## Dynamic feed integration milestone

### Added on the feature branch

- Added `data/i18n/feed-map.json` to register the current ZEE daily note, daily philosophy, and four-dimension feeds, their stable identity keys, source locale, and expected English payload location.
- Added `i18n/dynamic-content.js`, a shared locale-safe reader. It normalizes locale tags, loads JSON without stale cache, extracts only published locale payloads, and never falls back to another language.
- Legacy English fields are accepted only when `translation_status_en: "published"` is explicitly present. Unmarked legacy fields are not treated as approved translations.
- Refactored `en/zhi.html` to use the shared reader for `translations.en` payloads.

### Upstream feed audit

At the time of this implementation, the live ZEE feeds expose Chinese-only content:
- `mia/daily.json`: Chinese diary, mood, theme, and tags.
- `mia/todays-philosophy.json`: Chinese philosophy and reflection.
- `mia/sections.json`: four Chinese sections with stable section IDs.

No English payload was present in those three upstream files. The feed map therefore leaves English endpoints unconfigured, and no page is allowed to infer or fabricate an English edition from Chinese text.

### Not yet implemented

- ZEE-side publication of reviewed English payloads for the three feeds.
- Connecting English home and Bar pages to those English feed payloads.
- A bilingual daily-content workflow and CI publication gate in the ZEE repository.
- Browser-level verification against live English payloads.

Existing upstream files and Chinese content remain unchanged. The changes are limited to the Mia bilingual feature branch.


## ZEE upstream publication audit and access boundary

Inspected the live `ZEEFSEE/ZEE` main-branch files:
- `mia/daily.json`
- `mia/todays-philosophy.json`
- `mia/sections.json`
- `.github/workflows/mia-daily.yml`

Findings:
- The three feeds are Chinese-only at inspection time.
- The daily workflow publishes only `mia/daily.json`, using a short-lived OIDC token, a server-side Supabase publisher, and `mia/safety-check.mjs` before committing the reviewed JSON.
- The workflow does not currently publish English translations, philosophy feed, or section feed.
- Proposed parallel outputs are `mia/daily.en.json`, `mia/todays-philosophy.en.json`, and `mia/sections.en.json`. They must preserve source date/section IDs and have their own translation review/publication status.

A write attempt to create `feature/mia-bilingual-feeds` in `ZEEFSEE/ZEE` was rejected by GitHub with HTTP 403 (resource not accessible by integration). No upstream files were modified. This is an external permission boundary, not a successful implementation. The Mia PR records the exact next integration contract; upstream write access or a user-created branch is required before implementing the ZEE-side feeds.


## Source-linked English draft batch — 2026-10-31

Added `data/i18n/upstream-drafts/2026-10-31.json` on the feature branch.

- Contains six stable records: one daily note, one philosophy entry, and four ZHI sections.
- Daily/philosophy records use the source date as identity; ZHI records use the existing stable section IDs.
- Original Chinese source text and source references are retained in the batch for comparison.
- Every English payload is explicitly `draft` and marked as an AI-assisted draft requiring human review.
- No translation has been marked `approved` or `published`; the production English reader must not render this batch.
- The file is a review artifact in the Mia repository, not a replacement for the canonical ZEE upstream feeds. It does not change any source JSON or the live site.

Static contract review: all six records use the expected record shape, stable IDs, valid source timestamps, allowed types/locales/statuses, and non-empty draft English copy. The repository validator should be run in CI against this file before merge; a full JSON Schema Draft 2020-12 validator remains a separate acceptance requirement.
