/**
 * solutions-bg-video.js
 * Lazily loads and plays the looping background video behind the homepage
 * "Our Solutions" section. The section sits well below the fold, so the
 * video ships with preload="none" and its real source in data-video-src —
 * nothing is fetched until the section is about to scroll into view
 * (IntersectionObserver, 200px rootMargin so it's ready just in time
 * rather than the instant it's visible). Playback pauses again once the
 * section scrolls out of view to save CPU/battery on a long page. Video
 * is skipped entirely — the static poster stays put, nothing is ever
 * fetched — under prefers-reduced-motion or when the browser reports Data
 * Saver (navigator.connection.saveData) is on. Self-contained — no-ops on
 * any page that doesn't have a .solutions-bg-video.
 */
(function () {
  'use strict';

  function init() {
    var video = document.querySelector('.solutions-bg-video');
    if (!video) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    if (reduceMotion || saveData) return;

    var loaded = false;
    function load() {
      if (loaded) return;
      var src = video.getAttribute('data-video-src');
      if (!src) return;
      loaded = true;
      video.src = src;
      video.load();
    }

    if (!('IntersectionObserver' in window)) {
      // No IntersectionObserver support: just load and play right away.
      load();
      video.play().catch(function () {});
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          load();
          var playPromise = video.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch(function () {
              // Autoplay can be rejected in rare cases — poster stays put.
            });
          }
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '200px 0px' });

    observer.observe(video);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
