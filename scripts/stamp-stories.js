#!/usr/bin/env node
/**
 * Assign immutable archive timestamps to newly added stories.
 * The timestamp is derived from the commit that first introduced the catalog change,
 * normalized to Asia/Shanghai (+08:00). Existing timestamps are never modified.
 */
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const file = 'data/stories.json';
const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(catalog.stories)) throw new Error('data/stories.json must contain a stories array');

let sourceDate;
try {
  sourceDate = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { encoding: 'utf8' }).trim();
} catch {}
const instant = sourceDate ? new Date(sourceDate) : new Date();
if (Number.isNaN(instant.getTime())) throw new Error('Could not determine catalog commit timestamp');

const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
}).formatToParts(instant).reduce((acc, part) => {
  if (part.type !== 'literal') acc[part.type] = part.value;
  return acc;
}, {});
const timestamp = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;

let changed = 0;
for (const story of catalog.stories) {
  if (!story.timestamp) {
    story.timestamp = timestamp;
    changed += 1;
  }
}
if (changed) {
  fs.writeFileSync(file, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Assigned immutable archive timestamp ${timestamp} to ${changed} new story record(s).`);
} else {
  console.log('No missing story timestamps. Existing archive timestamps preserved.');
}
