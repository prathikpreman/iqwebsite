/**
 * main.js
 * Small, page-wide bootstrap tasks that don't belong in a dedicated module.
 * Loaded last, after include.js / navigation.js / animations.js / interactions.js.
 */
(function () {
  'use strict';

  function setYear() {
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener('partials:loaded', setYear);
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('[data-include]')) setYear();
  });
})();
