/**
 * testimonial-slider.js
 * Homepage "Our Customers" testimonial slider: shows one testimonial at a
 * time, advanced manually via the left/right arrows or the pagination
 * dots (no autoplay — this is a manual slider per the client's request).
 * Self-contained — no-ops on any page that doesn't have a
 * [data-testimonial-slider].
 */
(function () {
  'use strict';

  function initTestimonialSlider() {
    var root = document.querySelector('[data-testimonial-slider]');
    if (!root) return;

    var slides = Array.prototype.slice.call(root.querySelectorAll('.testimonial-slide'));
    var dotsRoot = document.querySelector('[data-testimonial-dots]');
    var dots = dotsRoot ? Array.prototype.slice.call(dotsRoot.querySelectorAll('.testimonial-dot')) : [];
    var prevBtn = root.querySelector('[data-testimonial-prev]');
    var nextBtn = root.querySelector('[data-testimonial-next]');
    if (slides.length < 2) return;

    var current = slides.findIndex(function (s) { return s.classList.contains('is-active'); });
    if (current < 0) current = 0;

    function show(index) {
      var next = (index + slides.length) % slides.length;
      if (next === current) return;

      slides[current].classList.remove('is-active');
      slides[current].setAttribute('aria-hidden', 'true');
      if (dots[current]) {
        dots[current].classList.remove('is-active');
        dots[current].setAttribute('aria-selected', 'false');
      }

      current = next;

      slides[current].classList.add('is-active');
      slides[current].setAttribute('aria-hidden', 'false');
      if (dots[current]) {
        dots[current].classList.add('is-active');
        dots[current].setAttribute('aria-selected', 'true');
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { show(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1); });

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { show(i); });
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  document.addEventListener('DOMContentLoaded', initTestimonialSlider);
})();
