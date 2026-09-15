import { messages } from './locales/messages.js';
import { loadPreferences, saveLocalePreference } from './preferences.js';

export const supportedLocales = ['zh', 'en', 'ja'];
export const localeMeta = {
  zh: { label: '简体中文', lang: 'zh-CN', intl: 'zh-CN' },
  en: { label: 'English', lang: 'en', intl: 'en-US' },
  ja: { label: '日本語', lang: 'ja-JP', intl: 'ja-JP' },
};
export function normalizeLocale(value) {
  const code = String(value || '').toLowerCase().split(/[-_]/)[0];
  return supportedLocales.includes(code) ? code : null;
}
export function resolveLocale(saved, languages = []) {
  return normalizeLocale(saved) || languages.map(normalizeLocale).find(Boolean) || 'zh';
}
let locale = typeof window === 'undefined' ? 'zh' : resolveLocale(loadPreferences('').locale, navigator.languages || [navigator.language]);
export const getLocale = () => locale;
export const getIntlLocale = () => localeMeta[locale].intl;
const interpolate = (template, params) => template.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(params, key) ? params[key] : match);

// Workers keep errors in the source language. Resolve their parameterized messages
// at the UI boundary so an in-flight task uses the currently selected language.
const patterns = Object.keys(messages).filter((key) => /\{\w+\}/.test(key)).map((key) => {
  const tokens = [...key.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
  const expression = key.split(/\{\w+\}/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+?)');
  return { key, tokens, expression: new RegExp(`^${expression}$`, 's') };
});
export function t(source, params = {}, language = locale) {
  if (Object.hasOwn(messages, source)) return interpolate(messages[source][language] ?? source, params);
  for (const { key, tokens, expression } of patterns) {
    const match = expression.exec(source);
    if (match) return interpolate(messages[key][language] ?? key, Object.fromEntries(tokens.map((token, index) => [token, match[index + 1]])));
  }
  return interpolate(source, params);
}

const bindings = new WeakMap();
export function setText(node, source, params = {}) {
  bindings.set(node, { source, params });
  node.setAttribute('data-localized-text', '');
  node.textContent = t(source, params);
}
const staticBindings = [];
let initialized = false;
export function initI18n() {
  if (initialized) return;
  initialized = true;
  // Bind only the initial UI, never user input, filenames or generated results.
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script, style, textarea, noscript, [data-i18n], #locale-select')) continue;
    const source = node.textContent.trim();
    if (!Object.hasOwn(messages, source)) continue;
    const leading = node.textContent.match(/^\s*/)[0], trailing = node.textContent.match(/\s*$/)[0];
    staticBindings.push(() => { if (node.isConnected) node.textContent = leading + t(source) + trailing; });
  }
  document.querySelectorAll('*').forEach((node) => {
    for (const attribute of ['placeholder', 'aria-label', 'title', 'alt', 'content']) {
      if (attribute === 'content' && !node.matches('meta[name="description"]')) continue;
      if (node.hasAttribute(`data-i18n-${attribute}`)) continue;
      const source = node.getAttribute(attribute);
      if (source && Object.hasOwn(messages, source)) staticBindings.push(() => node.setAttribute(attribute, t(source)));
    }
  });
  const selector = document.querySelector('#locale-select');
  selector?.replaceChildren(...supportedLocales.map((code) => {
    const option = document.createElement('option');
    option.value = code; option.textContent = localeMeta[code].label;
    return option;
  }));
  selector?.addEventListener('change', () => setLocale(selector.value));
  render();
}
function render() {
  document.documentElement.lang = localeMeta[locale].lang;
  staticBindings.forEach((renderBinding) => renderBinding());
  document.querySelectorAll('[data-localized-text]').forEach((node) => {
    const binding = bindings.get(node);
    if (binding) node.textContent = t(binding.source, binding.params);
  });
  const selector = document.querySelector('#locale-select');
  if (selector) selector.value = locale;
}
export function setLocale(value) {
  locale = normalizeLocale(value) || 'zh';
  saveLocalePreference(locale);
  render();
  window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
  return locale;
}
