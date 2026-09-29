/**
 * navigation.js
 * Header scroll state, mobile menu (with focus trap), mobile accordion
 * submenus, and fully keyboard-operable desktop mega-dropdowns.
 * Runs once partials (header/footer) have been injected.
 */
(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled])';

  function init() {
    var header = document.querySelector('.site-header');
    var navToggle = document.querySelector('.nav-toggle');
    var mobileNav = document.querySelector('.mobile-nav');
    var mobileClose = document.querySelector('.mobile-nav-close');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lastFocused = null;

    /* ---------------------------------------------------------------- */
    /* Header scroll state                                              */
    /* ---------------------------------------------------------------- */
    if (header) {
      // Interior pages: toggle the "scrolled" visual state (solid
      // background, dark text) once the user scrolls past the hero.
      //
      // Homepage: the permanently-solid header look is handled entirely by
      // unconditional CSS now (see the "Homepage header" block in
      // components.css) so it's correct from first paint with no
      // dependency on this script having run yet. is-scrolled is still
      // added here for the homepage too, purely so it doesn't sit at odds
      // with the class name — nothing currently depends on it there.
      var alwaysScrolled = document.body.classList.contains('page-home');
      var onScroll = function () {
        header.classList.toggle('is-scrolled', alwaysScrolled || window.scrollY > 12);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---------------------------------------------------------------- */
    /* Mobile menu open/close + focus trap                              */
    /* ---------------------------------------------------------------- */
    function openMobileNav() {
      lastFocused = document.activeElement;
      mobileNav.classList.add('is-open');
      mobileNav.setAttribute('aria-hidden', 'false');
      navToggle.setAttribute('aria-expanded', 'true');
      if (header) header.classList.add('is-menu-open');
      document.body.style.overflow = 'hidden';
      var firstLink = mobileNav.querySelector(FOCUSABLE);
      if (firstLink) firstLink.focus();
    }

    function closeMobileNav() {
      mobileNav.classList.remove('is-open');
      mobileNav.setAttribute('aria-hidden', 'true');
      navToggle.setAttribute('aria-expanded', 'false');
      if (header) header.classList.remove('is-menu-open');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    if (navToggle && mobileNav) {
      navToggle.addEventListener('click', function () {
        var isOpen = mobileNav.classList.contains('is-open');
        if (isOpen) closeMobileNav(); else openMobileNav();
      });

      if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);

      // Only real destination links close the mobile menu on click — the
      // About Us / Offerings accordion triggers carry aria-expanded and
      // must only toggle their submenu, not dismiss the whole panel.
      mobileNav.querySelectorAll('a').forEach(function (link) {
        if (link.hasAttribute('aria-expanded')) return;
        link.addEventListener('click', function () {
          closeMobileNav();
        });
      });

      // Focus trap: keep Tab cycling inside the open mobile menu.
      mobileNav.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab' || !mobileNav.classList.contains('is-open')) return;
        var focusable = Array.prototype.slice.call(mobileNav.querySelectorAll(FOCUSABLE));
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /* Mobile accordion submenus (About Us, Offerings)                  */
    /* ---------------------------------------------------------------- */
    document.querySelectorAll('.mobile-nav-item').forEach(function (item) {
      var trigger = item.querySelector('.mobile-nav-link');
      var submenu = item.querySelector('.mobile-submenu');
      if (!submenu) return; // plain link, no submenu
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var willOpen = !item.classList.contains('is-open');
        document.querySelectorAll('.mobile-nav-item.is-open').forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove('is-open');
            var t = openItem.querySelector('.mobile-nav-link');
            if (t) t.setAttribute('aria-expanded', 'false');
          }
        });
        item.classList.toggle('is-open', willOpen);
        trigger.setAttribute('aria-expanded', String(willOpen));
      });
    });

    /* ---------------------------------------------------------------- */
    /* Desktop mega-dropdowns: hover (CSS) + full keyboard support      */
    /* ---------------------------------------------------------------- */
    var dropdowns = document.querySelectorAll('[data-dropdown]');

    function closeDropdown(item) {
      item.classList.remove('force-open');
      var trigger = item.querySelector('.nav-link');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }

    function closeAllDropdowns(except) {
      dropdowns.forEach(function (item) {
        if (item !== except) closeDropdown(item);
      });
    }

    function openDropdown(item) {
      closeAllDropdowns(item);
      item.classList.add('force-open');
      var trigger = item.querySelector('.nav-link');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }

    dropdowns.forEach(function (item) {
      var trigger = item.querySelector('.nav-link');
      var mega = item.querySelector('.mega');
      if (!trigger || !mega) return;

      // Visibility is driven only by CSS :hover and the .force-open class
      // (set/cleared below) — deliberately NOT by :focus-within, because
      // focus lands back on the trigger when Escape closes the menu, and
      // :focus-within would then immediately reopen it. Tab-focus opening
      // and focus-leaves-the-item closing are handled explicitly in JS
      // instead, below, so both keyboard paths still work correctly.
      var suppressFocusOpen = false;

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = item.classList.contains('force-open');
        if (isOpen) closeDropdown(item); else openDropdown(item);
      });

      trigger.addEventListener('focus', function () {
        if (suppressFocusOpen) { suppressFocusOpen = false; return; }
        openDropdown(item);
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          openDropdown(item);
          var first = mega.querySelector(FOCUSABLE);
          // A short delay, not a same-tick call: moving focus during the
          // browser's own dispatch of a trusted ArrowDown keydown gets
          // silently reverted in some browsers until that key event's
          // full routing (through keyup) has finished. 80ms clears that
          // window reliably while still reading as instant to the user.
          if (first) window.setTimeout(function () { first.focus(); }, 80);
        } else if (e.key === 'Escape') {
          suppressFocusOpen = true;
          closeDropdown(item);
          trigger.focus();
        }
      });

      // Keep it open while hovering (desktop pointer users get the CSS
      // :hover transition already; this just keeps state in sync so
      // keyboard/touch toggling and hover never fight each other).
      item.addEventListener('mouseenter', function () { item.classList.remove('force-open'); trigger.setAttribute('aria-expanded', 'true'); });
      item.addEventListener('mouseleave', function () { if (!item.classList.contains('force-open')) trigger.setAttribute('aria-expanded', 'false'); });

      // Once focus moves off the trigger AND off the mega panel entirely
      // (and the pointer isn't hovering it), close — mirrors the standard
      // Tab-out-closes-the-menu behavior of an accessible disclosure menu.
      item.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!item.contains(document.activeElement) && !item.matches(':hover')) {
            closeDropdown(item);
          }
        }, 0);
      });

      mega.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          suppressFocusOpen = true;
          closeDropdown(item);
          trigger.focus();
        }
      });
    });

    // Click outside closes any open (touch/keyboard-forced) dropdown.
    document.addEventListener('click', function (e) {
      dropdowns.forEach(function (item) {
        if (!item.contains(e.target)) closeDropdown(item);
      });
    });

    // Escape anywhere: close dropdowns and the mobile menu.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAllDropdowns();
      if (mobileNav && mobileNav.classList.contains('is-open')) closeMobileNav();
    });

    /* ---------------------------------------------------------------- */
    /* Back to top                                                      */
    /* ---------------------------------------------------------------- */
    var backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      window.addEventListener('scroll', function () {
        backToTop.classList.toggle('is-visible', window.scrollY > 640);
      }, { passive: true });
      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }

  if (document.querySelector('[data-include]')) {
    document.addEventListener('partials:loaded', init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
