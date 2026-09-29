/**
 * animations.js
 * Scroll-reveal via IntersectionObserver and animated counters.
 * Fully inert (content just shows) when prefers-reduced-motion is set,
 * or when IntersectionObserver is unavailable.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveal() {
    var els = document.querySelectorAll('[data-reveal], [data-reveal-group]');
    if (!els.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', (Math.min(i % 4, 3) * 0.08) + 's');
      observer.observe(el);
    });
  }

  // Formats the animated value the same way at every frame and at rest:
  // fixed decimals, plus thousand-separators for whole numbers (so a
  // data-count="11000" counts up as "1,...,11,000" instead of "11000").
  function formatCount(value, decimals) {
    var fixed = value.toFixed(decimals);
    if (decimals === 0) {
      return Number(fixed).toLocaleString('en-US');
    }
    return fixed;
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
    var duration = 1400;
    var start = null;

    if (reduceMotion) {
      el.textContent = prefix + formatCount(target, decimals) + suffix;
      return;
    }

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      var value = target * eased;
      el.textContent = prefix + formatCount(value, decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + formatCount(target, decimals) + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCount);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  function init() {
    initReveal();
    initCounters();
  }

  if (document.querySelector('[data-include]')) {
    document.addEventListener('partials:loaded', function () {}); // header/footer don't gate content reveal
  }
  document.addEventListener('DOMContentLoaded', init);
})();
