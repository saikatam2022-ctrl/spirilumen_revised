/* ============================================================
   BOOKING MODAL — booking-modal.js  (v2 — mystic redesign)
   "Book a Session" flow: category → service → duration → redirect

   ⚠️ EDIT BOOKING_CONFIG BELOW BEFORE GOING LIVE.
   Each duration needs its own `url` — Tidycal (and most booking
   tools) use a separate event-type link per duration, there is
   no reliable way to pass duration as a parameter to one link.
   Until real URLs are filled in, buttons fall back to
   FALLBACK_URL and a console warning is logged.
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. CONFIG ── */
  var FALLBACK_URL = 'https://tidycal.com/your-username';

  var BOOKING_CONFIG = [
    {
      id: 'astrology',
      name: 'Astrology',
      icon: '♄',
      tagline: 'Read the language written in the stars at your birth.',
      services: [
        {
          id: 'energy-reading',
          name: 'Energy Reading',
          icon: '✦',
          tagline: 'An intuitive read of your current energetic field.',
          durations: [
            { label: '20 min', phase: 'sliver', tag: 'A brief alignment',  url: '' },
            { label: '30 min', phase: 'half',   tag: 'A focused session',  url: '' },
            { label: '1 hour', phase: 'full',   tag: 'A full immersion',   url: '' }
          ]
        },
        {
          id: 'vedic-astrology',
          name: 'Vedic Astrology',
          icon: '♄',
          tagline: 'Ancient charts, precise timing, karmic insight.',
          durations: [
            { label: '20 min', phase: 'sliver', tag: 'A brief alignment',  url: '' },
            { label: '30 min', phase: 'half',   tag: 'A focused session',  url: '' },
            { label: '1 hour', phase: 'full',   tag: 'A full immersion',   url: '' }
          ]
        }
      ]
    },
    {
      id: 'healing',
      name: 'Healing',
      icon: '✧',
      tagline: 'Restore what time and noise have disturbed.',
      services: [
        {
          id: 'meditation',
          name: 'Meditation',
          icon: '☾',
          tagline: 'Stillness as medicine.',
          durations: [
            { label: '20 min', phase: 'sliver', tag: 'A brief alignment',  url: '' },
            { label: '30 min', phase: 'half',   tag: 'A focused session',  url: '' },
            { label: '1 hour', phase: 'full',   tag: 'A full immersion',   url: '' }
          ]
        },
        {
          id: 'reiki',
          name: 'Reiki',
          icon: '✺',
          tagline: 'Hands-on energy transmission for deep release.',
          durations: [
            { label: '20 min', phase: 'sliver', tag: 'A brief alignment',  url: '' },
            { label: '30 min', phase: 'half',   tag: 'A focused session',  url: '' },
            { label: '1 hour', phase: 'full',   tag: 'A full immersion',   url: '' }
          ]
        }
      ]
    }
  ];

  var STEP_ORDER = ['category', 'service', 'duration'];
  var STEP_GLYPH = { category: '✦', service: '◈', duration: '☾' };

  /* ── 2. STATE ── */
  var state = { categoryIdx: null, serviceIdx: null };

  /* ── 3. BUILD MODAL MARKUP ── */
  function buildModal() {
    var overlay = document.createElement('div');
    overlay.className = 'bm-overlay';
    overlay.id = 'bm-overlay';
    overlay.innerHTML =
      '<div class="bm-modal" role="dialog" aria-modal="true" aria-labelledby="bm-title">' +
        '<div class="bm-stars" id="bm-stars"></div>' +
        '<button class="bm-close" id="bm-close" aria-label="Close">✕</button>' +

        '<div class="bm-glyph-row">' +
          '<span class="bm-rule"></span>' +
          '<span class="bm-glyph-sun">☉</span>' +
          '<span class="bm-rule right"></span>' +
        '</div>' +
        '<div class="bm-eyebrow">Begin Your Journey</div>' +
        '<h3 class="bm-title" id="bm-title">Book a <em>Session</em></h3>' +
        '<p class="bm-sub" id="bm-sub"></p>' +

        '<div class="bm-stepper" id="bm-stepper"></div>' +

        '<div class="bm-step active" data-step="category">' +
          '<div class="bm-grid" id="bm-category-grid"></div>' +
        '</div>' +

        '<div class="bm-step" data-step="service">' +
          '<div class="bm-grid" id="bm-service-grid"></div>' +
        '</div>' +

        '<div class="bm-step" data-step="duration">' +
          '<div class="bm-grid bm-grid-duration" id="bm-duration-grid"></div>' +
        '</div>' +

        '<div class="bm-step" data-step="redirect">' +
          '<div class="bm-redirect">' +
            '<div class="bm-seal">' +
              '<div class="bm-seal-ring"></div>' +
              '<div class="bm-seal-ring r2"></div>' +
              '<div class="bm-seal-core"></div>' +
            '</div>' +
            '<div class="bm-redirect-eyebrow">Aligning the Stars</div>' +
            '<p class="bm-redirect-text" id="bm-redirect-text">Preparing your session…</p>' +
            '<p class="bm-redirect-sub">You are being carried to the booking page.</p>' +
            '<a class="bm-redirect-link" id="bm-redirect-link" target="_blank" rel="noopener">Click here if the stars are slow to move</a>' +
          '</div>' +
        '</div>' +

        '<div class="bm-trail" id="bm-trail"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('bm-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    buildStars();
    renderCategoryStep();
  }

  function buildStars() {
    var wrap = document.getElementById('bm-stars');
    var html = '';
    for (var i = 0; i < 22; i++) {
      var top = Math.random() * 100;
      var left = Math.random() * 100;
      var delay = (Math.random() * 3).toFixed(2);
      var dur = (2.4 + Math.random() * 2).toFixed(2);
      html += '<span class="bm-star" style="top:' + top + '%;left:' + left + '%;' +
        'animation-delay:' + delay + 's;animation-duration:' + dur + 's;"></span>';
    }
    wrap.innerHTML = html;
  }

  /* ── 4. CARD-GLOW MOUSE TRACKING (matches .svc-c pattern site-wide) ── */
  function attachGlow(el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ── 5. STEP RENDERERS ── */
  function renderCategoryStep() {
    var grid = document.getElementById('bm-category-grid');
    grid.innerHTML = '';
    BOOKING_CONFIG.forEach(function (cat, i) {
      grid.appendChild(makeCard(cat.icon, cat.name, cat.tagline, function () {
        state.categoryIdx = i;
        state.serviceIdx = null;
        goToStep('service');
      }));
    });
    document.getElementById('bm-sub').textContent = 'Two paths into the unseen — which calls to you?';
    renderStepper('category');
    renderTrail();
  }

  function renderServiceStep() {
    var cat = BOOKING_CONFIG[state.categoryIdx];
    var grid = document.getElementById('bm-service-grid');
    grid.className = 'bm-grid' + (cat.services.length <= 2 ? '' : '');
    grid.innerHTML = '';
    cat.services.forEach(function (svc, i) {
      grid.appendChild(makeCard(svc.icon, svc.name, svc.tagline, function () {
        state.serviceIdx = i;
        goToStep('duration');
      }));
    });
    document.getElementById('bm-sub').textContent = 'Within ' + cat.name + ', two ways to walk the path.';
    renderStepper('service');
    renderTrail();
  }

  function renderDurationStep() {
    var cat = BOOKING_CONFIG[state.categoryIdx];
    var svc = cat.services[state.serviceIdx];
    var grid = document.getElementById('bm-duration-grid');
    grid.innerHTML = '';
    svc.durations.forEach(function (dur) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'bm-dur-card';
      card.setAttribute('data-phase', dur.phase);
      card.innerHTML =
        '<span class="bm-moon"></span>' +
        '<span class="bm-dur-time">' + dur.label + '</span>' +
        '<span class="bm-dur-tag">' + dur.tag + '</span>';
      card.addEventListener('click', function () { goToRedirect(cat, svc, dur); });
      grid.appendChild(card);
    });
    document.getElementById('bm-sub').textContent = 'How long shall we sit with this, together?';
    renderStepper('duration');
    renderTrail();
  }

  function makeCard(icon, name, desc, onClick) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bm-card';
    btn.innerHTML =
      '<span class="bm-card-ic">' + icon + '</span>' +
      '<span class="bm-card-name">' + name + '</span>' +
      '<span class="bm-card-desc">' + desc + '</span>';
    btn.addEventListener('click', onClick);
    attachGlow(btn);
    return btn;
  }

  /* ── 6. CONSTELLATION STEPPER ── */
  function renderStepper(activeStep) {
    var el = document.getElementById('bm-stepper');
    var activeIdx = STEP_ORDER.indexOf(activeStep);
    var html = '';
    STEP_ORDER.forEach(function (step, i) {
      var cls = 'bm-node';
      if (i < activeIdx) cls += ' done';
      if (i === activeIdx) cls += ' current';
      html += '<div class="' + cls + '" data-step="' + step + '">' + STEP_GLYPH[step] + '</div>';
      if (i < STEP_ORDER.length - 1) {
        html += '<div class="bm-node-line' + (i < activeIdx ? ' filled' : '') + '"></div>';
      }
    });
    el.innerHTML = html;
    el.querySelectorAll('.bm-node.done').forEach(function (node) {
      node.addEventListener('click', function () { goToStep(node.getAttribute('data-step')); });
    });
  }

  /* ── 7. TEXT TRAIL (secondary, accessible nav) ── */
  function renderTrail() {
    var trail = document.getElementById('bm-trail');
    var parts = [{ label: 'Category', step: 'category' }];
    if (state.categoryIdx !== null) {
      parts.push({ label: BOOKING_CONFIG[state.categoryIdx].name, step: 'service' });
    }
    if (state.categoryIdx !== null && state.serviceIdx !== null) {
      parts.push({ label: BOOKING_CONFIG[state.categoryIdx].services[state.serviceIdx].name, step: 'duration' });
    }
    trail.innerHTML = '';
    parts.forEach(function (p, i) {
      var span = document.createElement('span');
      span.className = 'bm-crumb' + (i === parts.length - 1 ? ' current' : '');
      span.textContent = p.label;
      if (i !== parts.length - 1) span.addEventListener('click', function () { goToStep(p.step); });
      trail.appendChild(span);
      if (i < parts.length - 1) {
        var sep = document.createElement('span');
        sep.className = 'bm-trail-sep';
        sep.textContent = '·';
        trail.appendChild(sep);
      }
    });
  }

  /* ── 8. NAVIGATION ── */
  function goToStep(step) {
    if (step === 'category') renderCategoryStep();
    if (step === 'service')  renderServiceStep();
    if (step === 'duration') renderDurationStep();
    document.querySelectorAll('.bm-step').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-step') === step);
    });
  }

  function goToRedirect(cat, svc, dur) {
    document.querySelectorAll('.bm-step').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-step') === 'redirect');
    });
    document.getElementById('bm-sub').textContent = '';
    document.getElementById('bm-trail').innerHTML = '';
    document.getElementById('bm-stepper').querySelectorAll('.bm-node').forEach(function (n) {
      n.classList.add('done'); n.classList.remove('current');
    });

    var url = dur.url && dur.url.trim() ? dur.url.trim() : FALLBACK_URL;
    if (!dur.url || !dur.url.trim()) {
      console.warn(
        '[booking-modal] No URL configured for "' + cat.name + ' \u2192 ' + svc.name + ' \u2192 ' + dur.label +
        '". Falling back to FALLBACK_URL. Edit BOOKING_CONFIG in booking-modal.js.'
      );
    }

    document.getElementById('bm-redirect-text').textContent =
      'Your ' + dur.label + ' ' + svc.name + ' session awaits.';
    document.getElementById('bm-redirect-link').href = url;

    setTimeout(function () { window.location.href = url; }, 1400);
  }

  /* ── 9. OPEN / CLOSE ── */
  function openModal() {
    var overlay = document.getElementById('bm-overlay');
    if (!overlay) return;
    state.categoryIdx = null;
    state.serviceIdx = null;
    goToStep('category');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var overlay = document.getElementById('bm-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── 10. WIRE TRIGGERS — only links whose text is exactly "Book a Session" ── */
  function wireTriggers() {
    document.querySelectorAll('.nav-book, .hbs').forEach(function (el) {
      if (el.textContent.trim() !== 'Book a Session') return;
      el.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildModal();
    wireTriggers();
  });
})();