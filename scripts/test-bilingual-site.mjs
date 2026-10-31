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

const chineseEntry = read('zh/index.html');
assert.match(chineseEntry, /<html[^>]*lang="zh-CN"/i,
  'Chinese entry must declare Simplified Chinese');
assert.ok(chineseEntry.includes('href="../en/"'),
  'Chinese entry must provide an English language switch');
assert.ok(chineseEntry.includes('../world.html?space=bar&lang=zh') &&
  chineseEntry.includes('../world.html?space=time-capsule&lang=zh'),
  'Chinese entry must route its primary actions to the existing Chinese world shell');
assert.ok(exists('world.html'),
  'Chinese entry must point to an existing root Chinese world shell');
for (const phrase of ['在思绪之间，留一处安静', '停留片刻 · 进入空间', '时间胶囊 · 记忆的琥珀', '深呼吸 · 让世界暂时慢下来']) {
  assert.ok(chineseEntry.includes(phrase), 'Chinese entry is missing localized copy: ' + phrase);
}
assert.ok(!/A QUIET PLACE BETWEEN THOUGHTS|STAY A LITTLE|TIME CAPSULE|BREATHE IN · LET THE WORLD WAIT/.test(chineseEntry),
  'Chinese entry must not mix English interface copy into the Chinese experience');

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

const englishReader = read('en/story.html');
assert.ok(
  englishReader.includes("(lang==='zh'?'../story.html':'story.html')+'?'+p.toString()+location.hash"),
  'English story language switch must target the root Chinese reader and preserve query/hash state'
);
const chineseReader = read('story.html');
assert.ok(
  chineseReader.includes("languageParams.set('lang','en')") &&
  chineseReader.includes("'en/story.html?'+languageParams.toString()+location.hash"),
  'Chinese story language switch must target the English reader and preserve query/hash state'
);
assert.ok(
  englishReader.includes("const key='mia-story-progress:'+story.id"),
  'English reader must continue using the established per-story progress key'
);


for (const file of pages) {
  assert.doesNotMatch(read(file), /<script[^>]+src=["'][^"']*(?:^|\/)(?:content\.js|mia-album\.js)["']/i,
    `${file} must not import legacy Chinese-only content scripts`);
}
for (const file of pages) {
  assert.ok(read(file).includes('#mia-pwa-install[data-ready="true"]'),
    file + ' must reveal the install control when installation is available');
}
const enManifest = JSON.parse(read('en/manifest.json'));
assert.equal(enManifest.lang, 'en');
assert.equal(enManifest.scope, '/mia/en/');
assert.equal(enManifest.start_url, '/mia/en/index.html');
assert.equal(enManifest.icons[0].src, '../mia-pwa.svg');
const enWorker = read('en/sw.js');
assert.ok(enWorker.includes("'mia-cafe-en-pwa-v1'"));
assert.ok(enWorker.includes('key.startsWith(CACHE_PREFIX)'));
const zhWorker = read('sw.js');
assert.ok(zhWorker.includes("key.startsWith('mia-cafe-pwa-')"));
assert.ok(!zhWorker.includes("keys.filter(key=>key!==CACHE_NAME)"));
for (const file of pages) {
  const html = read(file);
  assert.ok(html.includes('rel="manifest"'), file + ' must link the English manifest');
  assert.ok(html.includes("register('sw.js'"), file + ' must register the English worker');
}
console.log('Bilingual site smoke tests passed (locale routing, 11 English pages, 7 spaces, 9 original photos, storage compatibility, language isolation).');
