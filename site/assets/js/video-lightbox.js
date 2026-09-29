/**
 * video-lightbox.js
 * Homepage "Video and Photos Library": clicking a video thumbnail opens a
 * modal popup with the YouTube video embedded and playing, instead of
 * navigating away to youtube.com. Self-contained — no-ops on any page
 * that doesn't have a #video-modal.
 */
(function () {
  'use strict';

  function initVideoLightbox() {
    var modal = document.getElementById('video-modal');
    var frame = document.getElementById('video-modal-frame');
    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-youtube-id]'));
    if (!modal || !frame || !triggers.length) return;

    var lastFocused = null;

    function open(id) {
      lastFocused = document.activeElement;
      var iframe = document.createElement('iframe');
      iframe.setAttribute('src', 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0');
      iframe.setAttribute('title', 'YouTube video player');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      frame.appendChild(iframe);
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      var closeBtn = modal.querySelector('.video-modal-close');
      if (closeBtn) closeBtn.focus();
      document.addEventListener('keydown', onKeydown);
    }

    function close() {
      modal.hidden = true;
      document.body.style.overflow = '';
      frame.innerHTML = ''; // drop the iframe so playback (and audio) actually stops
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape' || e.keyCode === 27) close();
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-youtube-id');
        if (id) open(id);
      });
    });

    Array.prototype.slice.call(modal.querySelectorAll('[data-video-close]')).forEach(function (el) {
      el.addEventListener('click', close);
    });
  }

  document.addEventListener('DOMContentLoaded', initVideoLightbox);
})();
