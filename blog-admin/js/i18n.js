/**
 * i18n.js — Lightweight internationalization module
 * Depends on: locales/vi.js, locales/en.js (loaded before this file)
 */
const I18n = (() => {
  const STORAGE_KEY = 'blog-lang';
  const DEFAULT_LANG = 'en';

  let _lang = localStorage.getItem(STORAGE_KEY) || window.__i18n_default__ || DEFAULT_LANG;
  let _dict = {};

  function _resolve(key) {
    const parts = key.split('.');
    let node = _dict;
    for (const p of parts) {
      if (node == null || typeof node !== 'object') return null;
      node = node[p];
    }
    return typeof node === 'string' ? node : null;
  }

  function t(key, params) {
    let val = _resolve(key);
    if (val == null) return key;
    if (params) val = val.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
    return val;
  }

  function getLang() { return _lang; }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    location.reload();
  }

  function toggle() {
    setLang(_lang === 'vi' ? 'en' : 'vi');
  }

  function _applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = t(el.dataset.i18n);
      if (val === el.dataset.i18n) return;
      if (el.children.length === 0) {
        el.textContent = val;
      } else {
        // Has child elements (icons etc.) — replace only text nodes
        const textNodes = Array.from(el.childNodes).filter(
          n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
        );
        if (textNodes.length > 0) {
          textNodes[textNodes.length - 1].textContent = val;
        } else {
          // No text node found, append one
          el.appendChild(document.createTextNode(val));
        }
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = t(el.dataset.i18nPlaceholder);
      if (val !== el.dataset.i18nPlaceholder) el.placeholder = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const val = t(el.dataset.i18nHtml);
      if (val !== el.dataset.i18nHtml) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const val = t(el.dataset.i18nTitle);
      if (val !== el.dataset.i18nTitle) el.title = val;
    });
    document.documentElement.lang = _lang;
  }

  function init() {
    _dict = (window.__i18n__ || {})[_lang] || {};
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _applyToDOM);
    } else {
      _applyToDOM();
    }
  }

  // Re-apply after dynamic content is rendered (call this after ui.js renders layout)
  function applyToDOM() { _applyToDOM(); }

  init();
  return { t, getLang, setLang, toggle, applyToDOM };
})();
