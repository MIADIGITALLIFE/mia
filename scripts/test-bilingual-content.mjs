#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const validator = path.resolve('scripts/validate-bilingual-content.mjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mia-i18n-test-'));
const base = {
  schema_version: '1.0',
  id: 'daily_note:2026-10-31',
  type: 'daily_note',
  source_locale: 'zh-CN',
  created_at: '2026-10-31T10:00:00+08:00',
  translations: {
    'zh-CN': { status: 'published', title: '中文原文' },
    en: { status: 'draft', title: 'English draft' }
  }
};
function run(record, name) {
  const file = path.join(dir, name + '.json');
  fs.writeFileSync(file, JSON.stringify(record));
  return spawnSync(process.execPath, [validator, file], { encoding: 'utf8' });
}
try {
  const draft = run(base, 'draft');
  assert.equal(draft.status, 0, 'draft English content should validate but remain unpublished');

  const unreviewed = structuredClone(base);
  unreviewed.translations.en.status = 'published';
  const blocked = run(unreviewed, 'unreviewed');
  assert.equal(blocked.status, 1, 'published English without reviewer metadata must fail');
  assert.match(blocked.stderr, /reviewed_by/);
  assert.match(blocked.stderr, /reviewed_at/);

  const reviewed = structuredClone(unreviewed);
  reviewed.translations.en.reviewed_by = 'human-reviewer';
  reviewed.translations.en.reviewed_at = '2026-10-31T12:00:00+08:00';
  const approved = run(reviewed, 'reviewed');
  assert.equal(approved.status, 0, 'reviewed English publication should validate');

  const unknown = structuredClone(base);
  unknown.translations.en.unreviewed_claim = true;
  const rejected = run(unknown, 'unknown-field');
  assert.equal(rejected.status, 1, 'unknown payload fields must fail');
  assert.match(rejected.stderr, /unknown payload property/);

  console.log('Bilingual validator boundary tests passed (4 cases).');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
