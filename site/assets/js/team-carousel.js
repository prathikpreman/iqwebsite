/**
 * team-carousel.js
 * Homepage "Meet the Team" carousel: pages a fixed number of member cards
 * at a time (4 desktop / 2 tablet / 1 mobile — matching the site's usual
 * 900px/560px breakpoints), autoplay (4s), pagination dots rebuilt per
 * breakpoint, arrows, and Left/Right arrow-key support. Same interaction
 * conventions as carousel.js (hero) and testimonial-slider.js: pauses on
 * hover/focus, no autoplay at all under prefers-reduced-motion (manual
 * controls stay active either way). Self-contained — no-ops on any page
 * that doesn't have a [data-team-carousel].
 */
(function () {
  'use strict';

  function perPageForWidth(width) {
    if (width <= 560) return 1;
    if (width <= 900) return 2;
    return 4;
  }

  function initTeamCarousel() {
    var root = document.querySelector('[data-team-carousel]');
    if (!root) return;

    var viewport = root.querySelector('.team-viewport');
    var track = root.querySelector('[data-team-track]');
    var items = Array.prototype.slice.call(track.children);
    var prevBtn = root.querySelector('[data-team-prev]');
    var nextBtn = root.querySelector('[data-team-next]');
    var dotsWrap = document.querySelector('[data-team-dots]');
    if (!viewport || !track || !items.length || !dotsWrap) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var DELAY = 4000;
    var timer = null;

    var perPage = 0;
    var pageCount = 0;
    var current = 0;
    var dots = [];

    function buildDots() {
      dotsWrap.innerHTML = '';
      dots = [];
      for (var i = 0; i < pageCount; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'team-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Show team members ' + (i + 1) + ' of ' + pageCount);
        dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
        if (i === current) dot.classList.add('is-active');
        (function (index) {
          dot.addEventListener('click', function () {
            goTo(index);
            restart();
          });
        })(i);
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }

    function layout() {
      var width = viewport.clientWidth;
      var nextPerPage = perPageForWidth(window.innerWidth);
      var itemWidth = width / nextPerPage;

      items.forEach(function (item) {
        item.style.width = itemWidth + 'px';
      });

      var structureChanged = nextPerPage !== perPage;
      perPage = nextPerPage;
      pageCount = Math.max(1, Math.ceil(items.length / perPage));
      if (current > pageCount - 1) current = pageCount - 1;

      if (structureChanged || dots.length !== pageCount) buildDots();
      applyTransform(false);
    }

    function applyTransform(animate) {
      var width = viewport.clientWidth;
      track.style.transition = animate === false ? 'none' : '';
      track.style.transform = 'translateX(-' + (width * current) + 'px)';
      if (animate === false) {
        // force reflow so the next transform change (e.g. on resize) animates again
        void track.offsetHeight;
        track.style.transition = '';
      }
      dots.forEach(function (dot, i) {
        var active = i === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function goTo(index) {
      current = (index + pageCount) % pageCount;
      applyTransform(true);
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    function start() {
      if (reduceMotion) return;
      stop();
      timer = window.setInterval(next, DELAY);
    }
    function restart() { start(); }

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { prev(); restart(); }
      else if (e.key === 'ArrowRight') { next(); restart(); }
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 150);
    });

    layout();
    start();
  }

  document.addEventListener('DOMContentLoaded', initTeamCarousel);
})();
