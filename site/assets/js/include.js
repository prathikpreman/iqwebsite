/**
 * include.js
 * Lightweight HTML partial loader. Elements with [data-include="header|footer"]
 * get their matching partial fetched and injected. Keeps header/footer markup
 * in one place (partials/header.html, partials/footer.html) across every page.
 *
 * Requires the page to be served over http(s) (fetch() cannot read local
 * files via file://) — standard for any real deployment or local dev server.
 */
(function () {
  'use strict';

  // Same cache-bust convention as the CSS/JS <link>/<script> tags (see
  // build-notes Phase 58) — without it, a browser that already has a page
  // open/cached keeps serving the old header/footer partial after an edit.
  // Bump alongside the sitewide ?v=NN whenever header.html or footer.html changes.
  var PARTIAL_VERSION = '58';

  function partialPath(name) {
    // Pages compute their depth via <html data-root="../"> (root pages omit it).
    var root = document.documentElement.getAttribute('data-root') || '';
    return root + 'partials/' + name + '.html?v=' + PARTIAL_VERSION;
  }

  function rewriteRootLinks(container) {
    // Most data-root-href/src targets (careers.html, about/*, assets/*, ...) live
    // alongside this page under the site's "content root" (data-root). index.html
    // is the one exception — it sits one level further up, at the true domain
    // root — so it's resolved against data-site-root instead.
    var root = document.documentElement.getAttribute('data-root') || '';
    var siteRoot = document.documentElement.getAttribute('data-site-root');
    if (siteRoot === null) siteRoot = root;
    container.querySelectorAll('[data-root-href]').forEach(function (el) {
      var href = el.getAttribute('data-root-href');
      if (href.indexOf('#') === 0) { el.setAttribute('href', href); return; }
      var base = (href === 'index.html') ? siteRoot : root;
      el.setAttribute('href', base + href);
    });
    container.querySelectorAll('[data-root-src]').forEach(function (el) {
      el.setAttribute('src', root + el.getAttribute('data-root-src'));
    });
  }

  function currentNavKey() {
    // Depth-agnostic: matches regardless of how many folders a page sits
    // under (e.g. /site/about/... as well as /about/...).
    var path = window.location.pathname;
    if (/^\/(index\.html)?$/.test(path)) return 'home';
    if (path.indexOf('/about/') !== -1) return 'about';
    if (path.indexOf('/solutions/') !== -1 || path.indexOf('/services/') !== -1) return 'offerings';
    if (/\/careers(\.html)?$/.test(path)) return 'careers';
    if (/\/contact(\.html)?$/.test(path)) return 'contact';
    return null;
  }

  function markActive(container) {
    var path = window.location.pathname.replace(/\/index\.html$/, '/');

    // Leaf-level exact matches (mega-menu items, mobile submenu items).
    container.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      try {
        var url = new URL(href, window.location.href);
        var normalized = url.pathname.replace(/\/index\.html$/, '/');
        if (normalized === path && normalized !== '/') {
          a.classList.add('is-active');
          a.setAttribute('aria-current', 'page');
        }
      } catch (e) { /* ignore malformed hrefs */ }
    });

    // Top-level nav/section triggers (Home, About Us, Offerings, Careers, Contact)
    // — driven by data-nav-key rather than exact href match, since About Us and
    // Offerings are parents of several distinct destination pages.
    var key = currentNavKey();
    if (key) {
      container.querySelectorAll('[data-nav-key="' + key + '"]').forEach(function (el) {
        el.classList.add('is-active');
        if (key !== 'home') el.setAttribute('aria-current', 'true');
      });
    }
  }

  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));
  var pending = targets.length;

  if (pending === 0) {
    document.dispatchEvent(new CustomEvent('partials:loaded'));
    return;
  }

  targets.forEach(function (el) {
    var name = el.getAttribute('data-include');
    fetch(partialPath(name))
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load partial: ' + name);
        return res.text();
      })
      .then(function (html) {
        el.innerHTML = html;
        rewriteRootLinks(el);
        markActive(el);
      })
      .catch(function (err) {
        console.error(err);
      })
      .finally(function () {
        pending -= 1;
        if (pending === 0) {
          document.dispatchEvent(new CustomEvent('partials:loaded'));
        }
      });
  });
})();
