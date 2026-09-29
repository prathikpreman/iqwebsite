/**
 * carousel.js
 * Homepage hero carousel: autoplay (5s), pagination dots, pause on
 * hover/focus, and no autoplay at all under prefers-reduced-motion (dots
 * stay clickable either way). Self-contained — no-ops on any page that
 * doesn't have a .hero-carousel.
 *
 * Each slide's background is a short looping muted video. To keep the
 * homepage fast, no video data is requested up front: every <video> ships
 * with preload="none" and its real source in a data-video-src attribute,
 * so out of the box the browser paints only the lightweight poster image.
 * On init this script assigns the active slide's video source and starts
 * it playing immediately (that's the only video fetched right away); the
 * other three are then prefetched one at a time on a fixed stagger (a
 * couple of seconds apart) so they're ready before autoplay ever reaches
 * them, without ever downloading all four at once and competing with the
 * page's initial load — a plain time-based delay, not requestIdleCallback,
 * since idle callbacks can all fire back-to-back on an otherwise-quiet
 * page and end up bursting every request together anyway. Video is
 * skipped entirely — poster stays static, nothing is ever fetched — under
 * prefers-reduced-motion or when the browser reports Data Saver
 * (navigator.connection.saveData) is on.
 */
(function () {
  'use strict';

  function initHeroCarousel() {
    var root = document.querySelector('.hero-carousel');
    if (!root) return;

    var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('.hero-dot'));
    if (slides.length < 2 || slides.length !== dots.length) return;

    var videos = slides.map(function (s) { return s.querySelector('.hero-video'); });

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var allowVideo = !reduceMotion && !saveData;

    var current = slides.findIndex(function (s) { return s.classList.contains('is-active'); });
    if (current < 0) current = 0;
    var DELAY = 5000;
    var timer = null;

    function loadVideo(video) {
      if (!video || !allowVideo || video.dataset.loaded === 'true') return;
      var src = video.getAttribute('data-video-src');
      if (!src) return;
      video.dataset.loaded = 'true';
      video.src = src;
      video.load();
    }

    function playVideo(video) {
      if (!video || !allowVideo) return;
      loadVideo(video);
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          // Autoplay can be rejected in rare cases (e.g. very low power mode)
          // — the poster frame just stays put, no error surfaced to the user.
        });
      }
    }

    function pauseVideo(video) {
      if (video) video.pause();
    }

    // Stagger the other slides' downloads a couple of seconds apart so they
    // never compete with the active slide's video (or the rest of the page)
    // for bandwidth right at load, but are still well ahead of the 5s
    // autoplay tick by the time each one is actually needed.
    var PREFETCH_START_DELAY = 2500;
    var PREFETCH_STAGGER = 2000;

    function prefetchRest() {
      if (!allowVideo) return;
      var others = videos.filter(function (v, i) { return i !== current; });
      others.forEach(function (video, idx) {
        window.setTimeout(function () { loadVideo(video); }, PREFETCH_START_DELAY + idx * PREFETCH_STAGGER);
      });
    }

    function show(index) {
      var next = (index + slides.length) % slides.length;
      if (next === current) return;

      slides[current].classList.remove('is-active');
      slides[current].setAttribute('aria-hidden', 'true');
      dots[current].classList.remove('is-active');
      dots[current].setAttribute('aria-selected', 'false');
      pauseVideo(videos[current]);

      current = next;

      slides[current].classList.add('is-active');
      slides[current].setAttribute('aria-hidden', 'false');
      dots[current].classList.add('is-active');
      dots[current].setAttribute('aria-selected', 'true');
      playVideo(videos[current]);
    }

    function tick() { show(current + 1); }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    function start() {
      if (reduceMotion) return;
      stop();
      timer = window.setInterval(tick, DELAY);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start(); // manual pick shouldn't get cut short by the pending tick
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    playVideo(videos[current]);
    prefetchRest();

    start();
  }

  document.addEventListener('DOMContentLoaded', initHeroCarousel);
})();
