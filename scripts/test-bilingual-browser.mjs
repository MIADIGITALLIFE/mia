import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173/mia';
const routes = [
  '/en/', '/zh/', '/en/world.html', '/en/bar.html', '/en/music.html',
  '/en/greenhouse.html', '/en/archive.html', '/en/time-capsule.html',
  '/en/stories.html', '/en/story.html', '/en/zhi.html',
  '/world.html', '/bar.html', '/music.html', '/greenhouse.html',
  '/archive.html', '/time-capsule.html', '/stories.html', '/story.html', '/zhi.html'
];
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  const desktop = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await desktop.newPage();
  page.on('pageerror', error => failures.push('pageerror: ' + error.message));

  await page.goto(base + '/?acceptance=1', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/mia\/en\//, { timeout: 10000 });
  if (!(await page.locator('html').getAttribute('lang') === 'en')) failures.push('root default did not resolve to English');

  await page.goto(base + '/?lang=zh&acceptance=1', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/mia\/zh\//, { timeout: 10000 });
  if (!(await page.locator('html').getAttribute('lang') === 'zh-CN')) failures.push('explicit Chinese entry did not resolve to zh-CN');

  for (const route of routes) {
    const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    if (!response || response.status() >= 400) failures.push(route + ' returned ' + (response?.status() ?? 'no response'));
    const lang = await page.locator('html').getAttribute('lang');
    if (route.startsWith('/en/') && lang !== 'en') failures.push(route + ' html lang=' + lang);
    if (!route.startsWith('/en/') && lang !== 'zh-CN') failures.push(route + ' html lang=' + lang);
    await page.waitForTimeout(100);
  }

  await page.goto(base + '/en/world.html?space=bar&story=sample#chapter-2', { waitUntil: 'domcontentloaded' });
  const zhSwitch = page.locator('#language-switch');
  if (await zhSwitch.count()) {
    const href = await zhSwitch.getAttribute('href');
    if (!href?.includes('space=bar') || !href?.includes('story=sample') || !href?.endsWith('#chapter-2')) failures.push('English shell language switch did not preserve query/hash: ' + href);
  } else failures.push('English shell language switch missing');

  await page.goto(base + '/world.html?space=bar&story=sample#chapter-2', { waitUntil: 'domcontentloaded' });
  const enSwitch = page.locator('#mia-language-switch');
  if (await enSwitch.count()) {
    const href = await enSwitch.getAttribute('href');
    if (!href?.includes('space=bar') || !href?.includes('story=sample') || !href?.endsWith('#chapter-2')) failures.push('Chinese shell language switch did not preserve query/hash: ' + href);
  } else failures.push('Chinese shell language switch missing');

  const mobile = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, isMobile: true });
  const mobilePage = await mobile.newPage();
  mobilePage.on('pageerror', error => failures.push('mobile pageerror: ' + error.message));
  for (const route of ['/en/', '/zh/', '/en/world.html', '/world.html', '/en/bar.html', '/bar.html', '/en/archive.html', '/archive.html', '/en/time-capsule.html', '/time-capsule.html']) {
    await mobilePage.goto(base + route, { waitUntil: 'domcontentloaded' });
    const sizes = await mobilePage.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    if (sizes.scroll > sizes.client + 2) failures.push(route + ' horizontal overflow ' + JSON.stringify(sizes));
  }
  await mobile.close();
  await desktop.close();
} catch (error) {
  failures.push(error.stack || String(error));
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Browser acceptance smoke tests passed: locale entry, 20 routes, query/hash switch preservation, and 10 mobile layouts.');
