# Mia bilingual content contract v1.0

## Purpose

This contract gives Mia and ZEE one locale-neutral identity for every dynamic content item, with independently versioned and reviewed language payloads. It is a data contract, not a translation engine and not a claim that translations already exist.

## Files

- `content.schema.json`: JSON Schema Draft 2020-12 for one content record.
- `content.example.json`: illustrative record only; it is not production content.
- Existing feeds remain authoritative until a deliberate migration is reviewed and released.

## Record model

Each record has one stable `id`, one `type`, source locale, timestamps, optional source reference, and a `translations` object keyed by locale (`zh-CN`, `en`).

Supported types: `daily_note`, `philosophy`, `zhi_section`, `story`, `story_chapter`, `time_capsule_entry`.

Identity and provenance fields are language-neutral. Localized text belongs only inside the matching locale payload. Do not place translated titles or body text in shared top-level fields.

## Translation lifecycle

Each locale payload has an explicit status:

- `draft`: machine or human draft; never shown to public readers.
- `in_review`: awaiting language/editorial review; never shown to public readers.
- `approved`: reviewed translation, ready for publication.
- `published`: approved and publicly released.
- `unavailable`: intentionally no edition in this locale.

A public page may render a locale payload only when its status is `published`. The original-language edition can be published while the other locale remains unavailable. Never silently substitute one locale for another.

## Immutable history

- Existing Time Capsule snapshots are immutable. Do not rewrite or regenerate historical source text to add translations.
- Add translations as parallel locale payloads keyed by the same stable record ID, or in a linked translation record that preserves the source ID.
- Never modify an existing story ID, chapter order, source body, or historical timestamp as part of localization.
- A source timestamp is provenance, not necessarily a verified publication/creation time. Preserve its original meaning and label placeholder dates accurately.

## Story rules

A story and each chapter keep stable IDs. Chapter translations use the same chapter ID and parent story ID. Original text remains under its source locale. A reader must not display a translation unless the locale payload is published.

## ZHI feed compatibility

The current `sections.json` feed uses legacy flat fields and may later add locale payloads. The current English ZHI page only renders explicit `*_en` fields. During migration, a reader may accept either:

1. the new `translations.en` payload with `status: published`; or
2. legacy `*_en` fields, but only under an explicit published/approved state.

Do not migrate or mutate the upstream ZEE feed as part of this website-only contract.

## Publication and validation gates

Before publishing a localized record:
1. Validate against `content.schema.json`.
2. Confirm stable record ID and source locale.
3. Confirm translation status is `published` and review metadata is present for human-reviewed content.
4. Confirm required text fields exist for that record type.
5. Confirm no source-locale text has leaked into the target locale UI.
6. Confirm timestamps and IDs match the source record.

## Migration sequence

1. Keep current JSON files and readers operational.
2. Introduce this contract for new bilingual content.
3. Add an adapter to the ZHI English page, then the Bar and daily feed.
4. Add bilingual Time Capsule entries without modifying historic snapshots.
5. Add formal story/chapter translation payloads only after editorial approval.
6. Move root to English and `/zh/` to Chinese only after the full acceptance checklist passes.

## Current status

This contract and example are added on the bilingual feature branch. Existing feeds have not been migrated, translated, or overwritten. No public page is switched to the new schema yet.

## Validation

Run the lightweight contract validator against one or more normalized content-record JSON files:

```sh
node scripts/validate-bilingual-content.mjs data/i18n/content.example.json
```

The validator checks stable IDs, supported record types/locales, timestamps, translation statuses, and publication metadata. It is a focused release gate for this contract; use a JSON Schema Draft 2020-12 validator as well when integrating it into a larger content pipeline.


## Dynamic feed registry and reader

- `data/i18n/feed-map.json` records the three current ZEE sources, their stable identity keys, source locale, and the expected English translation location.
- `i18n/dynamic-content.js` exposes `window.MiaContent` with `normalizeLocale`, `getLocalePayload`, `getCollectionPayload`, and `fetchJson`.
- The reader returns a locale payload only when its status is exactly `published`. It never falls back to another locale.
- Legacy English fields are accepted only when the record explicitly carries `translation_status_en: "published"`. Existing unmarked `*_en` fields are not enough.
- The reader is now used by `en/zhi.html`. The other feeds are registered but their upstream English payloads do not exist yet.

The current upstream feeds are Chinese-only. Do not point English UI at their source-language text. Add reviewed translations to the upstream data contract first, then expose them to the page.
