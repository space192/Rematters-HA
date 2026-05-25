/**
 * Rematters theme: light | dark | auto (system).
 * Preference key: rematters-theme
 */
(function () {
  var STORAGE_KEY = "rematters-theme";
  var MODES = ["light", "dark", "auto"];

  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function resolve(mode) {
    return mode === "auto" ? systemTheme() : mode;
  }

  function getStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return MODES.indexOf(v) >= 0 ? v : "light";
    } catch (e) {
      return "light";
    }
  }

  function apply(mode) {
    var resolved = resolve(mode);
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-mode", mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) { /* ignore */ }
    updateToggleUI(mode);
  }

  function updateToggleUI(mode) {
    document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      var active = btn.getAttribute("data-theme-set") === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function bindToggles() {
    document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(btn.getAttribute("data-theme-set"));
      });
    });
  }

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", function () {
    if (getStored() === "auto") {
      apply("auto");
    }
  });

  apply(getStored());
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindToggles);
  } else {
    bindToggles();
  }

  window.RemattersTheme = { apply: apply, get: getStored };
})();
