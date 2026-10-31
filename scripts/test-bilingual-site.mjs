#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);
const sandbox = {
  window: { location: {
    href: 'https://miadigitallife.github.io/mia/en/story.html?id=reverse-enlightenment&chapter=3#chapter-3',
    pathname: '/mia/en/story.html',
    search: '?id=reverse-enlightenment&chapter=3'
  } },
  URL,
  URLSearchParams
};
vm.runInNewContext(read('i18n/locale.js'), sandbox);
const i18n = sandbox.window.MiaI18n;
assert.equal(i18n.resolveLocale(sandbox.window.location), 'en');
assert.equal(i18n.resolveLocale({ pathname: '/mia/zh/index.html', search: '' }), 'zh');
assert.equal(i18n.resolveLocale({ pathname: '/mia/index.html', search: '?lang=zh-CN' }), 'zh');
assert.equal(
  i18n.withLocale(sandbox.window.location.href, 'zh', '/mia/'),
  '/mia/zh/story.html?id=reverse-enlightenment&chapter=3&lang=zh#chapter-3',
  'language switching must preserve story ID, query state, and chapter hash'
);

const pages = [
  'en/index.html', 'en/world.html', 'en/bar.html', 'en/music.html',
  'en/greenhouse.html', 'en/archive.html', 'en/time-capsule.html',
  'en/stories.html', 'en/story.html', 'en/zhi.html', 'en/unavailable.html'
];
for (const file of pages) {
  assert.ok(exists(file), `missing English page: ${file}`);
  assert.match(read(file), /<html[^>]*lang="en"/i, `${file} must declare English`);
}

const shell = read('en/world.html');
for (const space of ['bar', 'music', 'greenhouse', 'archive', 'zhi', 'time-capsule', 'stories']) {
  assert.ok(shell.includes(`'${space}'`), `English shell must route ${space}`);
}
assert.ok(shell.includes('unavailable.html'), 'unknown spaces must use the English fallback');

const photos = [
  '01-contemplation.jpg', '02-joy.jpg', '03-rain.jpg',
  '04-curiosity.jpg', '05-stillness.jpg', '06-wonder.jpg',
  '07-journey.jpg', '08-warmth.jpg', '09-breathe.jpg'
];
const archive = read('en/archive.html');
for (const photo of photos) {
  assert.ok(exists(path.join('assets', photo)), `original photo missing: ${photo}`);
  assert.ok(archive.includes(`../assets/${photo}`), `English archive must retain ${photo}`);
}
assert.ok(read('en/greenhouse.html').includes('mia-greenhouse-memories-v1'));
assert.ok(archive.includes('mia-greenhouse-memories-v1'));
assert.ok(read('en/story.html').includes("'mia-story-progress:'"),
  'English story reader must retain the established progress key prefix');

for (const file of pages) {
  assert.doesNotMatch(read(file), /<script[^>]+src=["'][^"']*(?:content\.js|mia-album\.js)["']/i,
    `${file} must not import legacy Chinese-only content scripts`);
}
console.log('Bilingual site smoke tests passed (locale routing, 11 English pages, 7 spaces, 9 original photos, storage compatibility, language isolation).');
