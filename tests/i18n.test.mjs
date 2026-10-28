import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sources = await Promise.all(['locales-east.js', 'locales-west.js', 'i18n.js'].map(async name => ({
  name,
  source: await readFile(new URL(`../dist/${name}`, import.meta.url), 'utf8'),
})));
const english = JSON.parse(sources[2].source.match(/const en = (\{[^\n]+\});/)[1]);
const expectedLocales = ['en', 'zh-CN', 'zh-TW', 'de', 'ja', 'ko', 'ar', 'fr', 'es', 'pt', 'ru'];
const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

// The boundary is limited to translated text/attributes, the language picker,
// storage and the public languagechange event consumed by the rest of the UI.
function harness({ saved = null, blockedStorage = false, intl = Intl } = {}) {
  const events = [], storage = new Map(), selectListeners = new Map();
  if (saved !== null) storage.set('elsewhere-language', saved);
  const text = { dataset: { i18n: 'explore' }, textContent: '' };
  const aria = { dataset: { i18nAria: 'close' }, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
  const input = { dataset: { i18nPlaceholder: 'searchPlaceholder' }, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
  const select = { innerHTML: '', value: '', addEventListener(name, callback) { selectListeners.set(name, callback); } };
  const document = {
    documentElement: {}, title: '',
    querySelector: selector => selector === '#languageSelect' ? select : null,
    querySelectorAll: selector => ({ '[data-i18n]': [text], '[data-i18n-aria]': [aria], '[data-i18n-placeholder]': [input] })[selector] ?? [],
    dispatchEvent: event => { events.push(event); return true; },
  };
  const context = {
    document, Intl: intl,
    CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    localStorage: {
      getItem(key) { if (blockedStorage) throw new Error('Storage blocked'); return storage.get(key) ?? null; },
      setItem(key, value) { if (blockedStorage) throw new Error('Storage blocked'); storage.set(key, value); },
    },
  };
  context.window = context;
  vm.createContext(context);
  for (const { source, name } of sources) vm.runInContext(source, context, { filename: name });
  return {
    api: context.EL, dictionaries: { en: english, ...context.EL_LOCALES },
    document, select, text, aria, input, storage, events,
    choose(locale) { select.value = locale; selectListeners.get('change')(); },
  };
}

test('all eleven offered languages have complete nonempty copy and matching placeholders', () => {
  const h = harness(), keys = Object.keys(english).sort();
  assert.deepEqual(Object.keys(h.dictionaries).sort(), [...expectedLocales].sort());
  assert.deepEqual([...h.select.innerHTML.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]), expectedLocales);
  for (const [locale, dictionary] of Object.entries(h.dictionaries)) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys, `${locale} must cover every English key without unknown keys`);
    for (const key of keys) {
      assert.equal(typeof dictionary[key], 'string', `${locale}.${key} must be text`);
      assert.ok(dictionary[key].trim(), `${locale}.${key} must not be blank`);
      assert.deepEqual(placeholders(dictionary[key]), placeholders(english[key]), `${locale}.${key} must preserve interpolation values`);
    }
  }
});

test('English is the first-visit default and saved supported languages are restored', () => {
  const first = harness();
  assert.equal(first.api.locale, 'en');
  assert.equal(first.select.value, 'en');
  assert.equal(first.text.textContent, 'Explore');
  assert.equal(first.document.documentElement.lang, 'en');
  assert.equal(first.document.documentElement.dir, 'ltr');
  const returning = harness({ saved: 'ja' });
  assert.equal(returning.api.locale, 'ja');
  assert.equal(returning.select.value, 'ja');
  assert.equal(returning.text.textContent, returning.dictionaries.ja.explore);
  assert.equal(returning.events.length, 0, 'Initial rendering must not emit a user language change');
  assert.equal(harness({ saved: 'unsupported' }).api.locale, 'en');
});

test('choosing Arabic translates text and attributes, persists the choice and enables RTL', () => {
  const h = harness();
  h.choose('ar');
  assert.equal(h.api.locale, 'ar');
  assert.equal(h.storage.get('elsewhere-language'), 'ar');
  assert.equal(h.document.documentElement.lang, 'ar');
  assert.equal(h.document.documentElement.dir, 'rtl');
  assert.equal(h.text.textContent, h.dictionaries.ar.explore);
  assert.equal(h.aria.attributes['aria-label'], h.dictionaries.ar.close);
  assert.equal(h.input.attributes.placeholder, h.dictionaries.ar.searchPlaceholder);
  assert.equal(h.document.title, `Little Elsewhere — ${h.dictionaries.ar.tagline}`);
  assert.equal(h.events.length, 1);
  assert.equal(h.events[0].type, 'languagechange');
  assert.equal(h.events[0].detail.locale, 'ar');
  h.choose('de');
  assert.equal(h.document.documentElement.dir, 'ltr', 'Leaving Arabic must restore left-to-right layout');
  assert.equal(h.storage.get('elsewhere-language'), 'de');
});

test('all locales interpolate country names and counts without leaving supplied tokens', () => {
  const h = harness();
  for (const locale of expectedLocales) {
    h.choose(locale);
    for (const [key, values] of [['enter', { place: 'Paris & $1' }], ['stamps', { count: 2, total: 3 }]]) {
      const expected = h.dictionaries[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
      assert.equal(h.api.t(key, values), expected, `${locale}.${key}`);
      assert.doesNotMatch(h.api.t(key, values), /\{\w+\}/);
    }
  }
  h.choose('en');
  assert.equal(h.api.t('enter'), 'Enter {place}', 'Unprovided values remain visible rather than becoming undefined');
  assert.equal(h.api.t('unknown_translation_key'), 'unknown_translation_key');
});

test('unavailable storage and unsupported locale requests do not break language switching', () => {
  const h = harness({ blockedStorage: true });
  assert.equal(h.api.locale, 'en');
  assert.doesNotThrow(() => h.choose('zh-TW'));
  assert.equal(h.api.locale, 'zh-TW');
  assert.equal(h.text.textContent, h.dictionaries['zh-TW'].explore);
  const changes = h.events.length;
  h.api.setLanguage('xx-unsupported');
  assert.equal(h.api.locale, 'zh-TW');
  assert.equal(h.events.length, changes);
});

test('country labels follow the chosen language and preserve a safe fallback', () => {
  const h = harness();
  for (const locale of expectedLocales) {
    h.choose(locale);
    for (const [code, fallback] of [['JP', 'Japan'], ['GL', 'Greenland'], ['DE', 'Germany'], ['KR', 'South Korea']]) assert.equal(h.api.countryName(code, fallback), new Intl.DisplayNames([locale], { type: 'region' }).of(code));
  }
  assert.equal(h.api.countryName('invalid-code', 'Unknown place'), 'Unknown place');
});

test('repeated country labels reuse translations and a formatter per language', () => {
  let constructions=0, lookups=0;
  class CountedDisplayNames {
    constructor(locales, options) { constructions++; this.formatter=new Intl.DisplayNames(locales, options); }
    of(code) { lookups++; return this.formatter.of(code); }
  }
  const h=harness({intl:{DisplayNames:CountedDisplayNames}});
  for(let i=0;i<500;i++){
    assert.equal(h.api.countryName('US','United States'),'United States');
    assert.equal(h.api.countryName('JP','Japan'),'Japan');
  }
  assert.equal(constructions,1);
  assert.equal(lookups,2);
  h.choose('zh-CN');
  assert.equal(h.api.countryName('US','United States'),'美国');
  assert.equal(constructions,2);
  h.choose('en');
  assert.equal(h.api.countryName('US','United States'),'United States');
  assert.equal(constructions,2,'Returning to a language reuses its formatter');
  assert.equal(lookups,3,'Returning to a language reuses its country labels');
});

test('choosing the current language does not repeat translation or change events', () => {
  const h=harness();
  h.choose('en');
  assert.equal(h.events.length,0);
  h.choose('de');
  h.choose('de');
  assert.equal(h.events.length,1);
  assert.equal(h.select.value,'de');
});
