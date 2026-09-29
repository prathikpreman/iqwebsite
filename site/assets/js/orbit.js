/**
 * orbit.js
 * Homepage "What we do" Nibras orbit diagram: highlights one of the six
 * capability nodes every 3 seconds and syncs the shared description panel
 * to match, mirroring carousel.js's autoplay/pause/reduced-motion pattern.
 * Self-contained — no-ops on any page that doesn't have a .orbit-diagram.
 */
(function () {
  'use strict';

  function initOrbit() {
    var root = document.querySelector('.orbit-diagram');
    if (!root) return;

    var nodes = Array.prototype.slice.call(root.querySelectorAll('.orbit-node'));
    var descTitle = root.querySelector('.orbit-desc-title');
    var descText = root.querySelector('.orbit-desc-text');
    if (nodes.length < 2 || !descTitle || !descText) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = nodes.findIndex(function (n) { return n.classList.contains('is-active'); });
    if (current < 0) current = 0;
    var DELAY = 3000;
    var timer = null;

    function syncDescription(node) {
      var label = node.querySelector('.orbit-node-label');
      var desc = node.querySelector('.orbit-node-desc');
      descTitle.textContent = label ? label.textContent.trim() : '';
      descText.textContent = desc ? desc.textContent.trim() : '';
    }

    function show(index) {
      var next = (index + nodes.length) % nodes.length;
      if (next === current) return;

      nodes[current].classList.remove('is-active');
      nodes[current].setAttribute('aria-pressed', 'false');

      current = next;

      nodes[current].classList.add('is-active');
      nodes[current].setAttribute('aria-pressed', 'true');
      syncDescription(nodes[current]);
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

    nodes.forEach(function (node, i) {
      node.addEventListener('click', function () {
        show(i);
        start(); // manual pick shouldn't get cut short by the pending tick
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    syncDescription(nodes[current]); // prime the panel from whatever's active in markup
    start();
  }

  document.addEventListener('DOMContentLoaded', initOrbit);
})();
