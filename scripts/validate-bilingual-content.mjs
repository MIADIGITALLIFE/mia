#!/usr/bin/env node
import fs from 'node:fs';

const allowedTypes = new Set(['daily_note','philosophy','zhi_section','story','story_chapter','time_capsule_entry']);
const allowedLocales = new Set(['zh-CN','en']);
const allowedStatuses = new Set(['draft','in_review','approved','published','unavailable']);
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
    if (record.schema_version !== '1.0') fail('schema_version must be 1.0');
    if (typeof record.id !== 'string' || !/^[a-z0-9][a-z0-9._:-]*$/.test(record.id)) fail('id must be a stable lowercase identifier');
    if (!allowedTypes.has(record.type)) fail('unsupported content type');
    if (!allowedLocales.has(record.source_locale)) fail('source_locale must be zh-CN or en');
    if (!record.created_at || Number.isNaN(Date.parse(record.created_at))) fail('created_at must be a valid date-time');
    if (!record.translations || typeof record.translations !== 'object' || Array.isArray(record.translations)) { fail('translations object is required'); return; }
    for (const [locale, payload] of Object.entries(record.translations)) {
      if (!allowedLocales.has(locale)) fail(`unsupported locale: ${locale}`);
      if (!payload || typeof payload !== 'object' || !allowedStatuses.has(payload.status)) { fail(`${locale} payload requires a valid status`); continue; }
      if (payload.status === 'published') {
        const hasText = ['title','subtitle','summary','body','focus','question','chapter_title'].some(key => typeof payload[key] === 'string' && payload[key].trim()) || (Array.isArray(payload.body) && payload.body.some(line => typeof line === 'string' && line.trim()));
        if (!hasText) fail(`${locale} is published but has no displayable text`);
        if (locale !== record.source_locale && (!payload.reviewed_by || !payload.reviewed_at)) fail(`${locale} translation must include reviewed_by and reviewed_at before publication`);
      }
    }
  });
}
if (errors) { console.error(`Bilingual content validation failed: ${errors} issue(s).`); process.exit(1); }
console.log(`Bilingual content validation passed for ${files.length} file(s).`);