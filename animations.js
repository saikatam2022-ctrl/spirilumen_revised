/* ============================================================
   SPIRILUMEN — animations.js
   Every individual JavaScript-driven animation, isolated and
   named clearly. Each animation is a self-contained IIFE or
   named function. Call initAllAnimations() to boot everything.

   INDEX
   ─────────────────────────────────────────────────────────
    1. initStarfieldCanvas        — Canvas starfield + constellation lines
    2. initCustomCursorSun        — Animated sun cursor tracks mouse
    3. initCursorTrailFollower    — Lagging moon-glyph trail follower
    4. initParticleTrailCanvas    — Zodiac/planet particle burst on mouse move
    5. initCursorHoverStates      — Cursor state changes on interactive elements
    6. initHeroSpiral             — SVG spiral draw-in + infinite CW rotation
    7. initMarqueePopulate        — Populate and run the service marquee strip
    8. initNavSolidOnScroll       — Nav becomes solid/blurred on scroll
    9. initScrollReveal           — IntersectionObserver fade-up reveal
   10. initMoonStripHover         — Moon phase emoji scale + glow on hover
   11. initStatCountUp            — Animated number count-up for stats
   12. initServiceCardMagneticGlow— Mouse-position radial glow on service cards
   ─────────────────────────────────────────────────────────
*/


/* ============================================================
   1. STARFIELD CANVAS
   Draws: twinkling stars (white / gold / violet) with subtle
   cross-shaped lens flares, and dim constellation line segments.
   ============================================================ */
function initStarfieldCanvas() {
  const canvas  = document.getElementById('spaceC');
  const ctx     = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const stars = [];
  const constellationLines = [];

  /* Rebuild star pool and constellation lines on resize */
  function buildStars() {
    stars.length = 0;
    constellationLines.length = 0;

    /* 340 stars with randomised properties */
    for (let i = 0; i < 340; i++) {
      const kind = Math.random();
      stars.push({
        px: Math.random() * W,
        py: Math.random() * H,
        r:  Math.random() * 1.8 + 0.25,
        op: Math.random() * 0.8 + 0.15,   // base opacity
        sp: Math.random() * 0.014 + 0.005, // twinkle speed
        ph: Math.random() * Math.PI * 2,   // twinkle phase offset
        gold:   kind < 0.14,               // 14% gold stars
        violet: kind >= 0.14 && kind < 0.32 // 18% violet stars
      });
    }

    /* 30 random anchor points — short line segments between close pairs */
    const anchors = [];
    for (let i = 0; i < 30; i++) {
      anchors.push({ x: Math.random() * W, y: Math.random() * H });
    }
    for (let i = 0; i < anchors.length - 1; i++) {
      const dist = Math.hypot(
        anchors[i + 1].x - anchors[i].x,
        anchors[i + 1].y - anchors[i].y
      );
      if (dist < 180) {
        constellationLines.push([anchors[i], anchors[i + 1]]);
      }
    }
  }

  buildStars();
  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildStars();
  });

  let t = 0; // global time

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    t += 0.007;

    /* Constellation lines — slow breathing opacity */
    constellationLines.forEach(([a, b]) => {
      const opacity = (Math.sin(t * 0.25) + 1) / 2 * 0.09 + 0.04;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
      ctx.lineWidth   = 0.6;
      ctx.stroke();
    });

    /* Stars */
    stars.forEach(s => {
      const opacity = s.op * (0.5 + 0.5 * Math.sin(t * s.sp * 5 + s.ph));
      ctx.beginPath();
      ctx.arc(s.px, s.py, s.r, 0, Math.PI * 2);

      if      (s.gold)   ctx.fillStyle = `rgba(226, 185, 90,  ${opacity})`;
      else if (s.violet) ctx.fillStyle = `rgba(196, 181, 253, ${opacity})`;
      else               ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.85})`;
      ctx.fill();

      /* Lens flare cross on larger bright stars */
      if (s.r > 1.1 && opacity > 0.4) {
        const flareCol = s.gold
          ? `rgba(226, 185, 90,  ${opacity * 0.4})`
          : s.violet
            ? `rgba(196, 181, 253, ${opacity * 0.4})`
            : `rgba(255, 255, 255, ${opacity * 0.25})`;
        const fl = s.r * 4;
        ctx.strokeStyle = flareCol;
        ctx.lineWidth   = 0.5;
        ctx.beginPath(); ctx.moveTo(s.px - fl, s.py); ctx.lineTo(s.px + fl, s.py); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.px, s.py - fl); ctx.lineTo(s.px, s.py + fl); ctx.stroke();
      }
    });

    requestAnimationFrame(drawFrame);
  }

  drawFrame();
}


/* ============================================================
   2. CUSTOM CURSOR — SUN ICON
   Moves the #cur-sun div instantly to mouse coordinates.
   The SVG inside it rotates via CSS (sunRotate keyframe).
   Desktop only — hidden and inactive on touch/mobile devices.
   ============================================================ */
function initCustomCursorSun() {
  const sunEl = document.getElementById('cur-sun');
  if (!sunEl) return;
 
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    sunEl.style.display = 'none';
    return;
  }
 
  /* Hide default system cursor site-wide */
  document.documentElement.style.cursor = 'none';
 
  document.addEventListener('mousemove', e => {
    sunEl.style.left = e.clientX + 'px';
    sunEl.style.top  = e.clientY + 'px';
  });
}
 

/* ============================================================
   3. CURSOR TRAIL FOLLOWER
   The #cur-trail glyph (☽/☾) lags softly behind the cursor
   using linear interpolation (lerp) each animation frame.
   Desktop only — hidden and inactive on touch/mobile devices.
   ============================================================ */
function initCursorTrailFollower() {
  const trailEl = document.getElementById('cur-trail');
  if (!trailEl) return;
 
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    trailEl.style.display = 'none';
    return;
  }
 
  let mouseX = 0, mouseY = 0;
  let lagX   = 0, lagY   = 0;
  const LERP = 0.08; // lower = more lag / softer follow
 
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
 
  function tick() {
    lagX += (mouseX - lagX) * LERP;
    lagY += (mouseY - lagY) * LERP;
    trailEl.style.left = lagX + 'px';
    trailEl.style.top  = lagY + 'px';
    requestAnimationFrame(tick);
  }
 
  tick();
}
 
/* ============================================================
   4. PARTICLE TRAIL CANVAS
   On every mousemove, emits 1–3 particles that drift upward
   and fade. Particles are either:
   - Radial gradient sparks (gold or violet)
   - Zodiac glyphs  (♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓)
   - Planet glyphs  (☉ ☽ ☿ ♀ ♂ ♃ ♄)
   - Sparkle glyphs (✦ ✧ ⋆ · ★)
   Desktop only — skipped on touch/mobile devices.
   ============================================================ */
function initParticleTrailCanvas() {
  const canvas = document.getElementById('trailC');
  if (!canvas) return;

  /* Skip on touch devices */
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx    = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const ZODIAC  = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  const PLANETS = ['☉','☽','☿','♀','♂','♃','♄'];
  const SPARKS  = ['✦','✧','⋆','·','★'];

  const particles = [];

  document.addEventListener('mousemove', e => {
    const count = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let glyph  = null;

      if      (rand > 0.75) glyph = PLANETS[Math.floor(Math.random() * PLANETS.length)];
      else if (rand > 0.55) glyph = ZODIAC [Math.floor(Math.random() * ZODIAC.length)];
      else if (rand > 0.38) glyph = SPARKS [Math.floor(Math.random() * SPARKS.length)];

      particles.push({
        x:    e.clientX + (Math.random() - 0.5) * 14,
        y:    e.clientY + (Math.random() - 0.5) * 14,
        vx:   (Math.random() - 0.5) * 1.1,
        vy:   -(Math.random() * 1.4 + 0.4),        // float upward
        life:  1,
        decay: 0.02 + Math.random() * 0.028,
        kind:  rand < 0.55 ? 0 : 1,                // 0 = gold, 1 = violet
        size:  Math.random() * 2.8 + 0.6,
        glyph,
        rot:   (Math.random() - 0.5) * 0.1,
        fontSize: 7 + Math.random() * 7
      });
    }
  });

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      /* Physics */
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy *= 0.97; // air friction
      p.vx *= 0.98;
      p.life -= p.decay;

      if (p.life <= 0) { particles.splice(i, 1); continue; }

      if (p.glyph) {
        /* ── Glyph particle ── */
        ctx.save();
        ctx.globalAlpha = p.life * 0.6;

        const isZodiac = ZODIAC.includes(p.glyph);
        const isPlanet = PLANETS.includes(p.glyph);

        if (isPlanet) {
          ctx.fillStyle = `rgba(167, 139, 250, ${p.life * 0.85})`;
          ctx.font      = `${p.fontSize + 3}px serif`;
        } else if (isZodiac) {
          ctx.fillStyle = `rgba(240, 200, 106, ${p.life * 0.80})`;
          ctx.font      = `${p.fontSize + 2}px serif`;
        } else {
          ctx.fillStyle = p.kind === 0
            ? `rgba(240, 200, 106, ${p.life * 0.80})`
            : `rgba(167, 139, 250, ${p.life * 0.80})`;
          ctx.font = `${p.fontSize}px serif`;
        }

        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * (particles.length - i));
        ctx.fillText(p.glyph, 0, 0);
        ctx.restore();

      } else {
        /* ── Radial gradient spark ── */
        const col = p.kind === 0 ? [240, 200, 106] : [167, 139, 250];
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.8);
        grad.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${p.life * 0.9})`);
        grad.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
        ctx.fill();

        /* Gold sparks get a tiny cross flare */
        if (p.kind === 0 && p.size > 1.5) {
          ctx.globalAlpha = p.life * 0.3;
          ctx.strokeStyle = `rgba(240, 200, 106, ${p.life})`;
          ctx.lineWidth   = 0.5;
          const fl = p.size * 4;
          ctx.beginPath(); ctx.moveTo(p.x - fl, p.y); ctx.lineTo(p.x + fl, p.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(p.x, p.y - fl); ctx.lineTo(p.x, p.y + fl); ctx.stroke();
        }
      }

      ctx.globalAlpha = 1; // reset
    }

    requestAnimationFrame(drawParticles);
  }

  drawParticles();
}


/* ============================================================
   5. CURSOR HOVER STATES
   When the cursor enters interactive elements, the sun cursor
   spins faster and turns violet; the trail glyph changes from
   ☽ to ☾.
   Desktop only — skipped on touch/mobile devices.
   ============================================================ */
function initCursorHoverStates() {
  const sunEl   = document.getElementById('cur-sun');
  const trailEl = document.getElementById('cur-trail');
  if (!sunEl || !trailEl) return;
 
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
 
  const SELECTOR = 'a, button, .svc-c, .tc, .stat, .ps, .moon-strip span, .nav-book';
 
  function applyHover() {
    sunEl.classList.add('hov');
    trailEl.classList.add('hov');
    trailEl.textContent = '☾';
  }
 
  function removeHover() {
    sunEl.classList.remove('hov');
    trailEl.classList.remove('hov');
    trailEl.textContent = '☽';
  }
 
  /* Delegated — fires for any matching element, present or future */
  document.addEventListener('mouseover', e => {
    if (e.target.closest(SELECTOR)) applyHover();
  });
 
  document.addEventListener('mouseout', e => {
    if (e.target.closest(SELECTOR)) removeHover();
  });
}
 
/* ============================================================
   6. HERO SPIRAL
   Builds an Archimedean spiral path in SVG, then:
   Phase 1 — Draws it on using a CSS stroke-dashoffset transition.
   Phase 2 — Removes dashoffset; rotates the whole group CW
             continuously — creating the infinite inward illusion.

   CONFIG object controls all tunable parameters.
   Desktop only — skipped and hidden on mobile/touch devices.
   ============================================================ */
function initHeroSpiral() {

  /* Skip spiral entirely on touch/mobile — too heavy, no real gain */
  const spiralSvg = document.getElementById('heroSpiralSvg');
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    if (spiralSvg) spiralSvg.style.display = 'none';
    return;
  }

  /* ── Tunable parameters ── */
  const CFG = {
    turns:     9,      // number of spiral loops
    steps:     900,    // polyline point density (higher = smoother)
    rFraction: 0.50,   // outer radius as fraction of hero width
    rInner:    3,      // inner terminus radius in px
    drawDur:   5.5,    // seconds for initial draw-in
    rotDur:    35,     // seconds for one full CW rotation
    strokeW:   1.6,    // stroke width in px
    strokeCol: 'rgba(196, 181, 253, 0.62)'
  };

  /* ── Inject or replace a <style> tag by ID ── */
  function injectStyle(id, css) {
    const old = document.getElementById(id);
    if (old) old.remove();
    const s = document.createElement('style');
    s.id          = id;
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── Build clockwise spiral point array ──
     SVG Y-axis points DOWN. Negate sin() to flip to CW.
     Iterates from outer (thetaMax) inward (0). */
  function buildSpiralPoints(cx, cy, rOuter, rInner) {
    const total = CFG.turns * 2 * Math.PI;
    const pts   = [];
    for (let i = 0; i <= CFG.steps; i++) {
      const t     = i / CFG.steps;
      const theta = total * (1 - t);
      const r     = rOuter + (rInner - rOuter) * t;
      const angle = theta + Math.PI; // PI offset: outer arm enters from left
      pts.push([
        cx + r * Math.cos(angle),
        cy - r * Math.sin(angle)   // negative sin → CW in SVG
      ]);
    }
    return pts;
  }

  /* ── Convert point array to smooth SVG Catmull-Rom cubic bezier path ── */
  function pointsToSVGPath(pts) {
    const K = 0.36; // tension
    let d = `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      d += ` C ${(p1[0] + (p2[0] - p0[0]) * K / 3).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) * K / 3).toFixed(2)} ` +
               `${(p2[0] - (p3[0] - p1[0]) * K / 3).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) * K / 3).toFixed(2)} ` +
               `${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
    }
    return d;
  }

  /* ── Main build & animate function (called on load + resize) ── */
  function buildAndAnimate() {
    const hero     = document.getElementById('home');
    const svg      = document.getElementById('heroSpiralSvg');
    const rotGroup = document.getElementById('heroSpiralRotGroup');
    const path     = document.getElementById('heroSpiralPath');
    const glowEl   = document.getElementById('heroSpiralGlow');
    const coreEl   = document.getElementById('heroSpiralCore');
    const maskRect = document.getElementById('spMaskRect');
    if (!hero || !svg || !path) return;

    /* ① Measure hero */
    const rect = hero.getBoundingClientRect();
    const W    = rect.width;
    const H    = rect.height;

    /* ② Size SVG */
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.width  = W + 'px';
    svg.style.height = H + 'px';

    /* ③ Centre point */
    const cx = W * 0.50;
    const cy = H * 0.50;

    /* ④ Radii */
    const rOuter = W * CFG.rFraction;
    const rInner = CFG.rInner;

    /* ⑤ Build & apply path */
    const pts = buildSpiralPoints(cx, cy, rOuter, rInner);
    path.setAttribute('d', pointsToSVGPath(pts));

    /* ⑥ Style path */
    Object.assign(path.style, {
      fill:           'none',
      stroke:         CFG.strokeCol,
      strokeWidth:    CFG.strokeW + 'px',
      strokeLinecap:  'round',
      strokeLinejoin: 'round',
      filter:         'url(#spGlow)'
    });

    /* ⑦ Mask rect */
    maskRect.setAttribute('x',      0);
    maskRect.setAttribute('y',      0);
    maskRect.setAttribute('width',  W);
    maskRect.setAttribute('height', H);

    /* ⑧ Focal elements at centre */
    glowEl.setAttribute('cx', cx.toFixed(2));
    glowEl.setAttribute('cy', cy.toFixed(2));
    coreEl.setAttribute('cx', cx.toFixed(2));
    coreEl.setAttribute('cy', cy.toFixed(2));

    /* ⑨ True path length */
    const pathLen = Math.round(path.getTotalLength());

    /* ────────────────────────────────────────────────────
       DRAW-IN REMOVED — spiral appears fully visible.
       Group fades in over 1.2s, then rotates CW immediately.
    ──────────────────────────────────────────────────── */
    Object.assign(path.style, {
      animation:        'none',
      transition:       'none',
      strokeDasharray:  'none',
      strokeDashoffset: '0'
    });

    /* Fade spiral group in */
    Object.assign(rotGroup.style, {
      animation:       'none',
      transformOrigin: `${cx}px ${cy}px`,
      opacity:         '0',
      transition:      'opacity 1.2s ease'
    });
    path.getBoundingClientRect(); // force reflow
    rotGroup.style.opacity = '1';

    /* Fade focal elements in shortly after */
    setTimeout(() => {
      glowEl.style.transition = 'opacity 1s ease';
      coreEl.style.transition = 'opacity 0.8s ease';
      glowEl.style.opacity    = '1';
      coreEl.style.opacity    = '1';
    }, 400);

    /* ────────────────────────────────────────────────────
       CLOCKWISE ROTATION — starts immediately
    ──────────────────────────────────────────────────── */
    setTimeout(() => {
      /* Unique keyframe name prevents collision on resize re-init */
      const uid = `spCW_${Math.floor(cx)}_${Date.now()}`;
      injectStyle(uid,
        `@keyframes ${uid} { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }`
      );

      /* Focal singularity pulse */
      injectStyle('spFocalPulse',
        `@keyframes spFocalPulse {
          0%,100%{ r:22; opacity:0.85; }
          50%    { r:38; opacity:0.25; }
        }`
      );

      /* Core dot flicker */
      injectStyle('spCorePulse',
        `@keyframes spCorePulse {
          0%,100%{ r:3;   opacity:0.95; }
          35%    { r:5;   opacity:0.60; }
          70%    { r:2.5; opacity:1;    }
        }`
      );

      /* Spiral stroke breathe */
      injectStyle('spBreathe',
        `@keyframes spBreathe {
          0%,100%{ stroke-opacity:0.62; }
          50%    { stroke-opacity:0.35; }
        }`
      );

      /* Apply CW rotation */
      rotGroup.style.transition      = 'none';
      rotGroup.style.transformOrigin = `${cx}px ${cy}px`;
      rotGroup.style.animation       = `${uid} ${CFG.rotDur}s linear infinite`;

      /* Apply pulses */
      glowEl.style.animation = 'spFocalPulse 6s ease-in-out infinite';
      coreEl.style.animation = 'spCorePulse  4s ease-in-out infinite';
      path.style.animation   = 'spBreathe   14s ease-in-out infinite';

    }, 1300); /* start rotation after fade-in completes */
  }

  /* Boot on load */
  if (document.readyState === 'complete') {
    buildAndAnimate();
  } else {
    window.addEventListener('load', buildAndAnimate);
  }

  /* Rebuild on resize */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const rg = document.getElementById('heroSpiralRotGroup');
      const p  = document.getElementById('heroSpiralPath');
      const g  = document.getElementById('heroSpiralGlow');
      const c  = document.getElementById('heroSpiralCore');
      if (rg) { rg.style.animation = 'none'; rg.style.transform = 'none'; }
      if (p)  { p.style.animation  = 'none'; p.style.transition = 'none'; }
      if (g)  { g.style.opacity = '0'; g.style.transition = 'none'; g.style.animation = 'none'; }
      if (c)  { c.style.opacity = '0'; c.style.transition = 'none'; c.style.animation = 'none'; }
      buildAndAnimate();
    }, 250);
  });
}


/* ============================================================
   7. MARQUEE POPULATE
   Generates 4× repetitions of service names into .mq-track
   so the CSS marqueeScroll animation loops seamlessly.
   ============================================================ */
function initMarqueePopulate() {
  const track = document.getElementById('mqT');
  if (!track) return;

  const ITEMS = [
    'Vedic Astrology', 'Tarot Reading',    'Reiki Healing',
    'Guided Meditation', 'Life Coaching',  'Law of Attraction',
    'Chakra Balancing',  'Sacred Learning','Manifestation',
    'Journey Towards Light'
  ];

  /* 4 full repetitions ensure no gap during animation reset */
  [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS].forEach(text => {
    const div     = document.createElement('div');
    div.className = 'mq-item';
    div.innerHTML = `${text}<span class="mq-sun">☀</span>`;
    track.appendChild(div);
  });
}


/* ============================================================
   8. NAV SOLID ON SCROLL
   Adds .solid class to nav once user scrolls past 55px,
   triggering the backdrop blur + border-bottom transition.
   ============================================================ */
function initNavSolidOnScroll() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('solid', window.scrollY > 55);
  }, { passive: true });
}


/* ============================================================
   9. SCROLL REVEAL
   Uses IntersectionObserver to add .vi to .rev elements
   as they enter the viewport, triggering the CSS fade-up.
   ============================================================ */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('vi');
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );

  document.querySelectorAll('.rev, .sl, .sh').forEach(el => observer.observe(el));
}


/* ============================================================
   10. MOON STRIP HOVER
   Each moon phase emoji scales up and gains a glow on hover.
   Resets on mouse leave.
   ============================================================ */
function initMoonStripHover() {
  document.querySelectorAll('.moon-strip span').forEach(span => {
    span.addEventListener('mouseenter', () => {
      span.style.cssText = `
        transform: scale(1.5) translateY(-6px);
        transition: all .3s;
        filter: drop-shadow(0 0 18px rgba(240, 200, 106, 1));
      `;
    });
    span.addEventListener('mouseleave', () => {
      span.style.cssText = '';
    });
  });
}


/* ============================================================
   11. STAT COUNT-UP
   Each .stat-n element's numeric value counts up from 0 when
   it enters the viewport (fires once via unobserve).
   Non-numeric values (e.g. "∞") are skipped gracefully.
   ============================================================ */
function initStatCountUp() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;

        const el      = e.target;
        const rawText = el.textContent;
        const digits  = rawText.replace(/[^\d]/g, '');

        if (!digits || isNaN(+digits)) return; // skip symbols like ∞

        const target = +digits;
        const suffix = rawText.replace(digits, '');
        let   current = 0;
        const FRAMES  = 55;
        const step    = target / FRAMES;

        const interval = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current) + suffix;
          if (current >= target) clearInterval(interval);
        }, 1600 / FRAMES);

        observer.unobserve(el);
      });
    },
    { threshold: 0.9 }
  );

  document.querySelectorAll('.stat-n').forEach(el => observer.observe(el));
}


/* ============================================================
   12. SERVICE CARD MAGNETIC GLOW
   Tracks mouse position within each .svc-c card and sets
   CSS custom properties --mx / --my, which drive the
   radial gradient glow in .svc-c::before.
   ============================================================ */
function initServiceCardMagneticGlow() {
  document.querySelectorAll('.svc-c').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top)  + 'px');
    });
  });
}


/* ============================================================
   13. CLICKABLE SERVICE CARDS
   Cards with a data-href attribute navigate to that URL on click.
   Clicks landing on an inner <a> are left to that link to handle.
   ============================================================ */
function initClickableServiceCards() {
  document.querySelectorAll('.svc-c[data-href]').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return; /* let inner links do their own thing */
      window.location.href = card.dataset.href;
    });
  });
}


/* ============================================================
   BOOT — Initialize all animations
   Call this once the DOM is ready.
   ============================================================ */
function initAllAnimations() {
  initStarfieldCanvas();
  initCustomCursorSun();
  initCursorTrailFollower();
  initParticleTrailCanvas();
  initCursorHoverStates();
  initHeroSpiral();
  initMarqueePopulate();
  initNavSolidOnScroll();
  initScrollReveal();
  initMoonStripHover();
  initStatCountUp();
  initServiceCardMagneticGlow();
  initClickableServiceCards();
}

/* Auto-boot when DOM is ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllAnimations);
} else {
  initAllAnimations();
}
