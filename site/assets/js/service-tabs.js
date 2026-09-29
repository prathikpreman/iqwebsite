/**
 * service-tabs.js
 * "Our Services" page: all three .service-block sections (Business
 * Transformation / Deployment Services / Productization Services) are
 * stacked and scroll normally. The sticky sidebar acts as a scrollspy —
 * clicking a link smooth-scrolls to its section, and as the reader
 * scrolls past each section the corresponding sidebar link lights up
 * (its icon goes to full opacity, its background darkens) to reflect
 * where they are. Also honors a #service-id already in the URL (this
 * page's own links, the homepage solution cards linking to
 * services/index.html#deployment-services) by scrolling straight to it
 * on load. Self-contained — no-ops on any page that doesn't have a
 * [data-services-nav].
 */
(function () {
  'use strict';

  function initServiceScrollspy() {
    var nav = document.querySelector('[data-services-nav]');
    var panelsRoot = document.querySelector('[data-services-panels]');
    if (!nav || !panelsRoot) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('[data-tab]'));
    var panels = Array.prototype.slice.call(panelsRoot.querySelectorAll('[data-panel]'));
    if (!links.length || !panels.length) return;

    function setActive(id) {
      links.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('data-tab') === id);
      });
    }

    // Smooth-scroll on click instead of the browser's instant jump —
    // .service-block already carries scroll-margin-top so this lands
    // just below the sticky site header.
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('data-tab');
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
      });
    });

    // Scrollspy: on scroll, find the panel whose top has crossed the
    // "active line" (just below the sticky header) and is the last one
    // to have done so — the standard nearest-above-the-fold approach,
    // robust to the panels' very different heights.
    var ACTIVE_LINE = 160;
    var ticking = false;

    function updateActiveFromScroll() {
      ticking = false;
      var current = panels[0];
      for (var i = 0; i < panels.length; i++) {
        if (panels[i].getBoundingClientRect().top - ACTIVE_LINE <= 0) {
          current = panels[i];
        }
      }
      setActive(current.id);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateActiveFromScroll);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // Land on the right section immediately if the page was opened with
    // a hash already set (e.g. services/index.html#deployment-services).
    var initialId = (window.location.hash || '').replace('#', '');
    var initialTarget = initialId && document.getElementById(initialId);
    if (initialTarget && panels.indexOf(initialTarget) !== -1) {
      initialTarget.scrollIntoView({ block: 'start' });
      setActive(initialId);
    } else {
      updateActiveFromScroll();
    }
  }

  document.addEventListener('DOMContentLoaded', initServiceScrollspy);
})();
