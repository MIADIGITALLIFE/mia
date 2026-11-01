# Mia bilingual candidate — acceptance report

**Status:** static-validation candidate; browser acceptance is still pending.  
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

## Manual acceptance still required

Static tests cannot prove browser behavior. Before calling the candidate fully accepted, test the Pages preview or a non-production preview build on desktop and mobile:

- [ ] Root entry opens English; explicit Chinese selection opens the Chinese edition.
- [ ] Language switches preserve `space`, story ID, chapter query, and hash.
- [ ] Every English room opens in English; untranslated records show the documented English notice.
- [ ] Every Chinese room remains Chinese and the EN switch returns to the matching English room.
- [ ] Background music, room audio, rain audio, and cross-room/cross-tab ownership behave as before.
- [ ] Story chapter navigation, hash restoration, and reading progress work in both locales.
- [ ] Time Capsule counts, date search, filters, and Chinese-original links work.
- [ ] All nine original photos load in the Archive.
- [ ] PWA install flow, offline fallback, cache update, and locale isolation work on supported browsers.
- [ ] Narrow mobile layouts, safe-area spacing, language control, and install control remain usable.

## Explicitly outside this candidate

The candidate does not claim that ZEE publishes English daily notes, philosophy, or four-dimension feeds. The upstream ZEE repository currently has Chinese-only feeds, and the attempted feature-branch creation was blocked by GitHub integration permission (HTTP 403). The six English drafts in `data/i18n/upstream-drafts/2026-10-31.json` remain review-only drafts and are not production translations.

ZEE feed generation, human translation review, publication workflows, and live English feed integration belong to the next phase after this candidate is accepted.

## Release gate

This candidate is ready for a browser-based acceptance pass, not yet for a production release. Do not merge or deploy until the manual checklist is completed and the owner explicitly approves release.
