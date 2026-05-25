/**
 * Ingress UI translations. Default locale: en.
 * Switch via header selector, ?lang=nl, or localStorage rematters_locale.
 */
(function (global) {
  const STORAGE_KEY = "rematters_locale";
  const DEFAULT_LOCALE = "en";
  const SUPPORTED = ["en", "nl"];

  let locale = DEFAULT_LOCALE;
  let strings = {};

  function t(key, vars) {
    let text = strings[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return text;
  }

  function resolveLocale(requested) {
    if (requested && SUPPORTED.includes(requested)) return requested;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const param = new URLSearchParams(location.search).get("lang");
    if (param && SUPPORTED.includes(param)) return param;
    const htmlLang = (document.documentElement.lang || "").slice(0, 2);
    if (SUPPORTED.includes(htmlLang)) return htmlLang;
    return DEFAULT_LOCALE;
  }

  async function loadLocaleFile(code) {
    const res = await fetch(`./static/locales/${code}.json`);
    if (!res.ok) throw new Error(`Locale ${code} not found`);
    return res.json();
  }

  function applyToDom() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key) el.placeholder = t(key);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (key) el.title = t(key);
    });
    const sel = document.getElementById("locale-select");
    if (sel) sel.value = locale;
  }

  async function setLocale(next) {
    locale = resolveLocale(next);
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    try {
      strings = await loadLocaleFile(locale);
    } catch {
      strings = await loadLocaleFile(DEFAULT_LOCALE);
      locale = DEFAULT_LOCALE;
    }
    applyToDom();
    global.dispatchEvent(new CustomEvent("rematters:locale", { detail: { locale } }));
  }

  async function initI18n() {
    locale = resolveLocale();
    document.documentElement.lang = locale;
    try {
      strings = await loadLocaleFile(locale);
    } catch {
      strings = await loadLocaleFile(DEFAULT_LOCALE);
      locale = DEFAULT_LOCALE;
      document.documentElement.lang = locale;
    }
    applyToDom();
  }

  global.RemattersI18n = {
    t,
    initI18n,
    setLocale,
    getLocale: () => locale,
    SUPPORTED,
  };
})(window);
