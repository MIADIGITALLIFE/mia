#!/usr/bin/env node
import fs from 'node:fs';

const allowedTypes = new Set(['daily_note','philosophy','zhi_section','story','story_chapter','time_capsule_entry']);
const allowedLocales = new Set(['zh-CN','en']);
const allowedStatuses = new Set(['draft','in_review','approved','published','unavailable']);
const topLevelKeys = new Set(['schema_version','id','type','parent_id','source_locale','created_at','published_at','source_updated_at','source_ref','immutable','translations']);
const payloadKeys = new Set(['status','title','subtitle','summary','body','tags','mood','focus','question','chapter_title','translator','reviewed_by','reviewed_at','published_at']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isDateTime = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/validate-bilingual-content.mjs <content.json> [...]');
  process.exit(2);
}
let errors = 0;
for (const file of files) {
  let records;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    records = Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.error(`${file}: invalid JSON — ${error.message}`);
    errors++;
    continue;
  }
  records.forEach((record, index) => {
    const where = `${file}[${index}]`;
    const fail = message => { console.error(`${where}: ${message}`); errors++; };
    if (!isObject(record)) { fail('record must be an object'); return; }
    for (const key of Object.keys(record)) if (!topLevelKeys.has(key)) fail(`unknown record property: ${key}`);
    for (const key of ['schema_version','id','type','source_locale','created_at','translations']) if (!(key in record)) fail(`missing required property: ${key}`);
    if (record.schema_version !== '1.0') fail('schema_version must be 1.0');
    if (typeof record.id !== 'string' || !/^[a-z0-9][a-z0-9._:-]*$/.test(record.id)) fail('id must be a stable lowercase identifier');
    if (!allowedTypes.has(record.type)) fail('unsupported content type');
    if (!allowedLocales.has(record.source_locale)) fail('source_locale must be zh-CN or en');
    if (!isDateTime(record.created_at)) fail('created_at must be a valid date-time');
    if (record.parent_id !== undefined && (typeof record.parent_id !== 'string' || !record.parent_id.trim())) fail('parent_id must be a non-empty string');
    for (const key of ['published_at','source_updated_at']) if (record[key] !== undefined && record[key] !== null && !isDateTime(record[key])) fail(`${key} must be a date-time or null`);
    if (record.source_ref !== undefined && record.source_ref !== null) { try { const url = new URL(record.source_ref); if (!['http:','https:'].includes(url.protocol)) fail('source_ref must be an HTTP(S) URI or null'); } catch { fail('source_ref must be an HTTP(S) URI or null'); } }
    if (record.immutable !== undefined && typeof record.immutable !== 'boolean') fail('immutable must be boolean');
    if (!isObject(record.translations) || Object.keys(record.translations).length < 1) { fail('translations must be a non-empty object'); return; }
    for (const locale of Object.keys(record.translations)) if (!allowedLocales.has(locale)) fail(`unsupported locale: ${locale}`);
    for (const [locale, payload] of Object.entries(record.translations)) {
      if (!isObject(payload)) { fail(`${locale} payload must be an object`); continue; }
      for (const key of Object.keys(payload)) if (!payloadKeys.has(key)) fail(`${locale} has unknown payload property: ${key}`);
      if (!allowedStatuses.has(payload.status)) { fail(`${locale} payload requires a valid status`); continue; }
      for (const key of ['title','subtitle','summary','focus','question','chapter_title','translator','reviewed_by']) {
        if (payload[key] !== undefined && typeof payload[key] !== 'string') fail(`${locale}.${key} must be a string`);
      }
      for (const key of ['tags','mood']) if (payload[key] !== undefined && (!Array.isArray(payload[key]) || payload[key].some(item => typeof item !== 'string'))) fail(`${locale}.${key} must be an array of strings`);
      if (payload.body !== undefined && typeof payload.body !== 'string' && (!Array.isArray(payload.body) || payload.body.some(line => typeof line !== 'string'))) fail(`${locale}.body must be a string or an array of strings`);
      for (const key of ['reviewed_at','published_at']) if (payload[key] !== undefined && !isDateTime(payload[key])) fail(`${locale}.${key} must be a valid date-time`);
      if (payload.status === 'published') {
        const hasText = ['title','subtitle','summary','body','focus','question','chapter_title'].some(key =>
          typeof payload[key] === 'string' ? payload[key].trim().length > 0 :
          Array.isArray(payload[key]) ? payload[key].some(line => line.trim().length > 0) : false
        );
        if (!hasText) fail(`${locale} is published but has no displayable text`);
        if (locale !== record.source_locale) {
          if (typeof payload.reviewed_by !== 'string' || !payload.reviewed_by.trim()) fail(`${locale} translation must include reviewed_by before publication`);
          if (!isDateTime(payload.reviewed_at)) fail(`${locale} translation must include a valid reviewed_at before publication`);
        }
      }
    }
  });
}
if (errors) { console.error(`Bilingual content validation failed: ${errors} issue(s).`); process.exit(1); }
console.log(`Bilingual content validation passed for ${files.length} file(s).`);
