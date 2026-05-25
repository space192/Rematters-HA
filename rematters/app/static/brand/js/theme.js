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
      if (btn.getAttribute("role") === "option") {
        btn.setAttribute("aria-selected", active ? "true" : "false");
      } else {
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      }
    });
    document.querySelectorAll(".theme-dropdown-current").forEach(function (icon) {
      var show = icon.getAttribute("data-theme-icon") === mode;
      icon.hidden = !show;
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll("[data-theme-dropdown]").forEach(function (root) {
      var menu = root.querySelector(".theme-dropdown-menu");
      var trigger = root.querySelector(".theme-dropdown-trigger");
      if (!menu || !trigger) return;
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    });
  }

  function toggleDropdown(root) {
    var menu = root.querySelector(".theme-dropdown-menu");
    var trigger = root.querySelector(".theme-dropdown-trigger");
    if (!menu || !trigger) return;
    var open = menu.hidden;
    closeAllDropdowns();
    if (open) {
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }
  }

  function bindToggles() {
    document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        apply(btn.getAttribute("data-theme-set"));
        closeAllDropdowns();
      });
    });

    document.querySelectorAll(".theme-dropdown-trigger").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var root = trigger.closest("[data-theme-dropdown]");
        if (root) toggleDropdown(root);
      });
    });

    document.addEventListener("click", function () {
      closeAllDropdowns();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAllDropdowns();
    });
  }

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", function () {
    if (getStored() === "auto") {
      apply("auto");
    }
  });

  function init() {
    apply(getStored());
    bindToggles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.RemattersTheme = { apply: apply, get: getStored };
})();
