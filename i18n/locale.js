/* Mia locale foundation — shared by the English and Simplified Chinese editions.
 * This module only resolves locale and builds equivalent URLs. It does not translate content.
 * Keep it inert until a page has a complete translation; never expose mixed-language pages.
 */
(function (global) {
  'use strict';

  const SUPPORTED = Object.freeze(['en', 'zh']);
  const DEFAULT_LOCALE = 'en';

  function normalizeLocale(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'zh' || raw.startsWith('zh-')) return 'zh';
    if (raw === 'en' || raw.startsWith('en-')) return 'en';
    return null;
  }

  function localeFromPath(pathname) {
    const match = String(pathname || '').match(/\/((?:en|zh))(?:\/|$)/i);
    return match ? normalizeLocale(match[1]) : null;
  }

  function resolveLocale(locationLike) {
    const loc = locationLike || global.location;
    const params = new URLSearchParams(loc.search || '');
    return normalizeLocale(params.get('lang')) ||
      localeFromPath(loc.pathname) ||
      DEFAULT_LOCALE;
  }

  function withLocale(urlLike, locale, basePath) {
    const targetLocale = normalizeLocale(locale);
    if (!targetLocale) throw new TypeError('Unsupported Mia locale');
    const current = new URL(urlLike || global.location.href, global.location.href);
    const base = basePath || '/mia/';
    const relative = current.pathname.startsWith(base)
      ? current.pathname.slice(base.length)
      : current.pathname.replace(/^\/+/, '');
    const segments = relative.split('/').filter(Boolean);
    if (segments[0] === 'en' || segments[0] === 'zh') segments.shift();
    const targetPath = base + targetLocale + '/' + (segments.length ? segments.join('/') : 'index.html');
    const params = new URLSearchParams(current.search);
    params.set('lang', targetLocale);
    const query = params.toString();
    return targetPath + (query ? '?' + query : '') + current.hash;
  }

  global.MiaI18n = Object.freeze({
    supported: SUPPORTED,
    defaultLocale: DEFAULT_LOCALE,
    normalizeLocale,
    localeFromPath,
    resolveLocale,
    withLocale
  });
})(window);
