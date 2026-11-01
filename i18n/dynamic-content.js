/* Locale-safe dynamic content reader. Never falls back across languages. */
(() => {
  'use strict';
  const LOCALES = new Set(['en', 'zh-CN']);
  const PUBLISHED = 'published';

  function normalizeLocale(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'zh' || raw.startsWith('zh-')) return 'zh-CN';
    return raw === 'en' || raw.startsWith('en-') ? 'en' : null;
  }

  function getLocalePayload(record, locale) {
    const lang = normalizeLocale(locale);
    if (!record || !lang) return null;

    const payload = record.translations && record.translations[lang];
    if (payload && payload.status === PUBLISHED) return payload;

    // Backward compatibility is deliberately opt-in and requires a published marker.
    if (lang === 'en' && record.translation_status_en === PUBLISHED) {
      const legacy = {};
      const fields = {
        title: 'title_en', subtitle: 'subtitle_en', summary: 'summary_en',
        body: 'content_en', focus: 'focus_en', tags: 'tags_en',
        mood: 'mood_en', question: 'question_en'
      };
      for (const [target, source] of Object.entries(fields)) {
        if (record[source] !== undefined) legacy[target] = record[source];
      }
      if (Object.keys(legacy).length > 0) return { ...legacy, status: PUBLISHED };
    }

    return null;
  }

  function getCollectionPayload(data, locale, collectionKey) {
    const lang = normalizeLocale(locale);
    if (!lang || !data || !Array.isArray(data[collectionKey])) return [];
    return data[collectionKey].map(record => {
      const localized = getLocalePayload(record, lang);
      return localized ? { ...record, localized } : null;
    }).filter(Boolean);
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: options.signal,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Content feed unavailable: ' + response.status);
    return response.json();
  }

  window.MiaContent = Object.freeze({
    normalizeLocale,
    getLocalePayload,
    getCollectionPayload,
    fetchJson
  });
})();
