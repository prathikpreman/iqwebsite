/**
 * tech-switcher.js
 * "Our Technology" page: a two-level switcher. The top row of 4 domain
 * tabs (Wells / Reservoirs / Facilities / Asset Management) swaps which
 * `.tech-panel` is visible — one domain's whole panel at a time, same as
 * before. Inside the visible panel, all of that domain's module content
 * (`.tech-module-detail`) is stacked in normal document flow, and the
 * sidebar list (`.tech-module`) acts as a scrollspy: as the reader scrolls
 * past each module, its sidebar entry auto-highlights — the same
 * nearest-above-the-fold technique used on the Our Services page
 * (services/index.html / service-tabs.js) — and clicking a sidebar entry
 * smooth-scrolls to that module instead of merely toggling visibility.
 * Everything defaults to its first item active in the markup itself (via
 * .is-active) so the page still reads correctly with JS disabled — this
 * script only handles switching/scrollspy. Self-contained — no-ops on any
 * page without a [data-tech-switcher].
 */
(function () {
  'use strict';

  var ACTIVE_LINE = 160;

  function initTechSwitcher() {
    var root = document.querySelector('[data-tech-switcher]');
    if (!root) return;

    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-tech-tab]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-tech-panel]'));

    function activePanel() {
      return root.querySelector('.tech-panel.is-active') || panels[0];
    }

    function updateScrollspyFor(panel) {
      if (!panel) return;
      var details = Array.prototype.slice.call(panel.querySelectorAll('[data-tech-detail]'));
      var modules = Array.prototype.slice.call(panel.querySelectorAll('[data-tech-module]'));
      if (!details.length || !modules.length) return;

      var current = details[0];
      for (var i = 0; i < details.length; i++) {
        if (details[i].getBoundingClientRect().top - ACTIVE_LINE <= 0) {
          current = details[i];
        }
      }
      var key = current.getAttribute('data-tech-detail');
      modules.forEach(function (m) {
        m.classList.toggle('is-active', m.getAttribute('data-tech-module') === key);
      });
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          updateScrollspyFor(activePanel());
        });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // Top-level domain tabs: swap which panel is visible.
    function activateTab(key) {
      // Bail out before touching anything if `key` isn't a real tab — an
      // unrecognized hash (e.g. a stray #anchor or typo) must leave the
      // current tab/panel exactly as they were, not strip .is-active from
      // every tab and leave the page with no tab highlighted.
      var hasMatch = tabs.some(function (t) { return t.getAttribute('data-tech-tab') === key; });
      if (!hasMatch) return false;

      tabs.forEach(function (t) {
        var active = t.getAttribute('data-tech-tab') === key;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(function (panel) {
        panel.classList.toggle('is-active', panel.getAttribute('data-tech-panel') === key);
      });
      updateScrollspyFor(activePanel());
      return true;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activateTab(tab.getAttribute('data-tech-tab'));
      });
    });

    // Sidebar module buttons: smooth-scroll to that module's detail block.
    // (Highlighting itself is then driven by scroll position, not the click.)
    panels.forEach(function (panel) {
      var modules = Array.prototype.slice.call(panel.querySelectorAll('[data-tech-module]'));
      modules.forEach(function (mod) {
        mod.addEventListener('click', function () {
          var key = mod.getAttribute('data-tech-module');
          var target = panel.querySelector('[data-tech-detail="' + key + '"]');
          if (!target) return;
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    });

    // Land on the right domain immediately if the page was opened with a
    // hash already set (e.g. index.html's "Our Solutions" cards link to
    // solutions/index.html#reservoirs) — same convention as the Our
    // Services page (services/index.html / service-tabs.js).
    var initialKey = (window.location.hash || '').replace('#', '');
    if (!initialKey || !activateTab(initialKey)) {
      updateScrollspyFor(activePanel());
    }
  }

  document.addEventListener('DOMContentLoaded', initTechSwitcher);
})();
