# Mia bilingual candidate — acceptance report

**Status:** automated static + headless-browser candidate checks passed; production deployment acceptance is still pending.  
**Branch:** `feature/mia-bilingual-foundation`  
**Pull request:** [#4](https://github.com/MIADIGITALLIFE/mia/pull/4)  
**Production:** unchanged; this report does not authorize merge or deployment.

## Candidate scope

This candidate delivers the English edition and a dedicated Simplified Chinese entry while preserving the existing Chinese room URLs as the Chinese edition's compatibility routes.

- Root entry defaults to English; `?lang=zh` and `?lang=zh-CN` select Chinese.
- `/en/` and `/zh/` provide explicit locale landing pages.
- English and Chinese room switches preserve query parameters and hashes, including story IDs and chapter anchors.
- English room pages are provided for Bar, Music, Greenhouse, Archive, Time Capsule, Stories, Story Reader, and ZHI Notes.
- Untranslated dynamic content is not silently substituted from the other language. The English ZHI view requires a published English payload. The English Time Capsule shows date/type metadata and directs readers to the Chinese original. The story reader identifies its Chinese novel body as original-language text because no approved English translation exists.
- The English Bar's built-in reflections are labelled as curated cards, not as a live daily feed.
- Original nine archive photographs, shared audio assets, existing story data, reading-progress keys, greenhouse-memory keys, and historical Time Capsule data are retained.
- English and Chinese PWA manifests and service-worker cache namespaces are separated. The Chinese worker explicitly skips the English route.

## Automated checks

The following checks are enforced by `.github/workflows/validate-bilingual-content.yml`:

1. Locale and bilingual-content record validation.
2. Publication-state rules: only explicitly published translations are eligible for localized display.
3. Site invariants: page language declarations, route preservation, locale switches, original photo references, legacy storage keys, PWA metadata/cache separation, and untranslated-content boundaries.

Latest recorded successful run before this report: [Run 41263834854](https://github.com/MIADIGITALLIFE/mia/actions/runs/41263834854), commit `9504056b8063d050bfdbb1035f981eff0df946d3`.

## Automated browser acceptance completed

A Playwright Chromium smoke test now runs against the candidate branch served locally at the GitHub Pages project path. It checks:

- Root default-English and explicit Simplified Chinese entry routing.
- HTTP response and declared `html lang` for 20 English/Chinese room routes.
- Query/hash preservation on both English and Chinese shell language switches.
- Horizontal overflow at a 360px mobile viewport across 10 key landing/shell/room pages.
- Uncaught page errors during navigation.

The first browser run found a 10px horizontal overflow on both locale landing pages. This was fixed with root-level horizontal overflow clipping and re-tested successfully in [browser run 41264484497](https://github.com/MIADIGITALLIFE/mia/actions/runs/41264484497). Static validation also passed for the same final landing-page commit in [run 41264490087](https://github.com/MIADIGITALLIFE/mia/actions/runs/41264490087).

## Manual acceptance still required

Static tests cannot prove browser behavior. Before calling the candidate fully accepted, test the Pages preview or a non-production preview build on desktop and mobile:

- [x] Root entry opens English; explicit Chinese selection opens the Chinese edition (headless Chromium).
- [x] Language switches preserve `space`, story ID, chapter query, and hash (headless Chromium).
- [x] English and Chinese route responses and `html lang` declarations checked for 20 room routes (headless Chromium); untranslated-content behavior remains covered by static regression tests.
- [ ] Every Chinese room remains Chinese and the EN switch returns to the matching English room.
- [ ] Background music, room audio, rain audio, and cross-room/cross-tab ownership behave as before.
- [ ] Story chapter navigation, hash restoration, and reading progress work in both locales.
- [ ] Time Capsule counts, date search, filters, and Chinese-original links work.
- [ ] All nine original photos load in the Archive.
- [ ] PWA install flow, offline fallback, cache update, and locale isolation work on supported browsers.
- [x] No horizontal overflow at 360px on 10 key mobile pages (headless Chromium). Visual safe-area, language-control and install-control usability still needs a human device pass.

## Explicitly outside this candidate

The candidate does not claim that ZEE publishes English daily notes, philosophy, or four-dimension feeds. The upstream ZEE repository currently has Chinese-only feeds, and the attempted feature-branch creation was blocked by GitHub integration permission (HTTP 403). The six English drafts in `data/i18n/upstream-drafts/2026-10-31.json` remain review-only drafts and are not production translations.

ZEE feed generation, human translation review, publication workflows, and live English feed integration belong to the next phase after this candidate is accepted.

## Release gate

This candidate has passed automated static checks and a headless Chromium browser smoke test. It has **not** yet been tested on the live GitHub Pages deployment or on physical desktop/mobile devices. Audio playback, real PWA installation/offline behavior, and cross-tab/cross-frame sound ownership remain manual checks. Do not merge or deploy to production until those checks are completed and the owner explicitly approves release.
