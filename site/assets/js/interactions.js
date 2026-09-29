/**
 * interactions.js
 * Tabs, accordions, expandable panels, and contact/careers form validation.
 * No backend — forms are structured so a fetch() POST can be dropped
 * straight into handleSubmit() when an API endpoint exists.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------- */
  /* Tabs                                                                    */
  /* ---------------------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      var buttons = group.querySelectorAll('.tab-btn');
      var panels = group.querySelectorAll('.tab-panel');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
          panels.forEach(function (p) { p.classList.remove('is-active'); });
          btn.setAttribute('aria-selected', 'true');
          var target = group.querySelector('#' + btn.getAttribute('aria-controls'));
          if (target) target.classList.add('is-active');
        });
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Accordions                                                              */
  /* ---------------------------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll('.accordion-item').forEach(function (item) {
      var trigger = item.querySelector('.accordion-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', function () {
        var isOpen = item.getAttribute('data-open') === 'true';
        var group = item.closest('[data-accordion-group="single"]');
        if (group) {
          group.querySelectorAll('.accordion-item').forEach(function (i) { i.setAttribute('data-open', 'false'); });
        }
        item.setAttribute('data-open', String(!isOpen));
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Expandable panels (solutions/services listings)                        */
  /* ---------------------------------------------------------------------- */
  function initPanels() {
    document.querySelectorAll('.panel').forEach(function (panel) {
      panel.addEventListener('click', function () {
        var expanded = panel.getAttribute('aria-expanded') === 'true';
        panel.setAttribute('aria-expanded', String(!expanded));
      });
      panel.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          panel.click();
        }
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Sticky services layout: click nav item -> scroll matching panel        */
  /* ---------------------------------------------------------------------- */
  function initServiceNav() {
    document.querySelectorAll('.services-nav button[data-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-target'));
        if (!target) return;
        document.querySelectorAll('.services-nav button').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Form validation (contact + careers)                                    */
  /* ---------------------------------------------------------------------- */
  var validators = {
    required: function (v) { return v.trim().length > 0; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
    minlength: function (v, len) { return v.trim().length >= parseInt(len, 10); },
    // Only checked when a file is actually selected — the field itself may
    // still be optional (no `required` rule alongside it).
    filetype: function (v, arg, input) {
      if (!input.files || !input.files[0]) return true;
      var allowed = (arg || '').split(',');
      var fname = input.files[0].name.toLowerCase();
      return allowed.some(function (ext) { return fname.endsWith(ext); });
    }
  };

  function validateField(field) {
    var input = field.querySelector('input, textarea, select');
    if (!input) return true;
    var rules = (input.getAttribute('data-validate') || '').split(' ').filter(Boolean);
    var errorEl = field.querySelector('.field-error');
    var value = input.type === 'file' ? (input.files && input.files[0] ? input.files[0].name : '') : input.value;

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i].split(':');
      var name = rule[0];
      var arg = rule[1];
      var fn = validators[name];
      if (fn && !fn(value, arg, input)) {
        field.classList.add('has-error');
        if (errorEl) errorEl.textContent = input.getAttribute('data-error-' + name) || 'This field needs your attention.';
        return false;
      }
    }
    field.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  function resetFileField(field) {
    var nameEl = field.querySelector('.file-field-name');
    var wrap = field.querySelector('.file-field');
    if (nameEl) nameEl.textContent = nameEl.getAttribute('data-placeholder') || 'Choose a file';
    if (wrap) wrap.classList.remove('has-file');
  }

  function initForms() {
    document.querySelectorAll('form[data-validate-form]').forEach(function (form) {
      var fields = form.querySelectorAll('.field');
      var status = form.querySelector('.form-status');

      fields.forEach(function (field) {
        var input = field.querySelector('input, textarea, select');
        if (!input) return;
        input.addEventListener('blur', function () { validateField(field); });

        if (input.type === 'file') {
          input.addEventListener('change', function () {
            var nameEl = field.querySelector('.file-field-name');
            var wrap = field.querySelector('.file-field');
            var file = input.files && input.files[0];
            if (nameEl) nameEl.textContent = file ? file.name : (nameEl.getAttribute('data-placeholder') || 'Choose a file');
            if (wrap) wrap.classList.toggle('has-file', !!file);
            validateField(field);
          });
        }
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var allValid = true;
        fields.forEach(function (field) {
          if (!validateField(field)) allValid = false;
        });

        if (!allValid) {
          if (status) {
            status.textContent = 'Please fix the highlighted fields and try again.';
            status.className = 'form-status is-error';
          }
          return;
        }

        handleSubmit(form, status, fields);
      });
    });
  }

  function handleSubmit(form, status, fields) {
    var submitBtn = form.querySelector('[type="submit"]');
    var defaultLabel = submitBtn ? (submitBtn.getAttribute('data-label') || submitBtn.textContent) : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    function finish() {
      form.reset();
      fields.forEach(function (field) {
        field.classList.remove('has-error');
        if (field.querySelector('.file-field')) resetFileField(field);
      });
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = defaultLabel; }
    }

    function onSuccess() {
      var modalSelector = form.getAttribute('data-success-modal');
      var modal = modalSelector ? document.querySelector(modalSelector) : null;
      if (modal) {
        openModal(modal);
      } else if (status) {
        status.textContent = form.getAttribute('data-success-message') || 'Thank you — your message has been received. Our team will respond shortly.';
        status.className = 'form-status is-success';
      }
      finish();
    }

    function onError() {
      if (status) {
        status.textContent = 'Something went wrong sending this — please try again, or reach us directly by email.';
        status.className = 'form-status is-error';
      }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = defaultLabel; }
    }

    // A form only POSTs for real once it has a live endpoint in its `action`
    // (e.g. a Formspree form ID swapped in for the "YOUR_FORM_ID" placeholder).
    // Until then, submissions are simulated so the UI — including the file
    // attachment and success state — is fully demonstrable without a backend.
    var endpoint = form.getAttribute('action');
    var hasLiveEndpoint = endpoint && endpoint.indexOf('YOUR_FORM_ID') === -1 && endpoint.charAt(0) !== '#';

    if (hasLiveEndpoint) {
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) { if (res.ok) { onSuccess(); } else { onError(); } })
        .catch(onError);
    } else {
      setTimeout(onSuccess, 700);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Success modal (e.g. careers application confirmation)                  */
  /* ---------------------------------------------------------------------- */
  function openModal(modal) {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var closeBtn = modal.querySelector('.form-success-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function initSuccessModals() {
    document.querySelectorAll('.form-success-modal').forEach(function (modal) {
      modal.querySelectorAll('[data-success-close]').forEach(function (el) {
        el.addEventListener('click', function () { closeModal(modal); });
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.form-success-modal').forEach(function (modal) {
        if (!modal.hidden) closeModal(modal);
      });
    });
  }

  function init() {
    initTabs();
    initAccordions();
    initPanels();
    initServiceNav();
    initForms();
    initSuccessModals();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
