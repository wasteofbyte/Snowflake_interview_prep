/**
 * Unified Scroll-Driven 3D Canvas Sequence, Scroll Progress Bar, HUD Telemetry & Typewriter
 * Shared across academy.html and module01..module16.
 */
(function () {
  'use strict';

  function initScrollStage() {
    // Inject shared CSS if not already present
    if (!document.getElementById('sf-scroll-stage-style')) {
      const st = document.createElement('style');
      st.id = 'sf-scroll-stage-style';
      st.textContent = `
        #scroll-progress{
          position:fixed;top:0;left:0;height:3px;width:0%;z-index:99;
          background:linear-gradient(90deg,var(--ice,#0A86C2),var(--teal,#0B8A6A),var(--violet,#6D28D9));
          box-shadow:0 0 10px var(--ice,#0A86C2);pointer-events:none;transition:width .06s linear;
        }
        #scroll-canvas{
          position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none;
        }
        body > header, body > main, body > footer, body > .top, body > .topbar, body > .wrap{
          position:relative;z-index:2;
        }
        .scroll-hud{
          position:fixed;bottom:18px;left:20px;z-index:35;
          display:inline-flex;align-items:center;gap:9px;padding:7px 14px;border-radius:99px;
          background:color-mix(in srgb,var(--card,#FFFFFF) 82%,transparent);
          border:1px solid var(--line2,rgba(11,27,43,.22));backdrop-filter:blur(10px);
          font-family:var(--f-mono,"JetBrains Mono",monospace);font-size:11px;color:var(--ink2,#46596B);
          box-shadow:0 6px 20px rgba(11,27,43,.10);pointer-events:none;
        }
        .scroll-hud-dot{width:7px;height:7px;border-radius:50%;background:var(--ice,#0A86C2);box-shadow:0 0 8px var(--ice,#0A86C2)}
        .tw-text{color:var(--ice,#0A86C2)}
        .tw-cursor{display:inline-block;color:var(--ice,#0A86C2);font-weight:300;margin-left:2px;animation:twBlink .9s steps(2,start) infinite}
        @keyframes twBlink{to{opacity:0}}
        @media(prefers-reduced-motion:reduce){.tw-cursor{animation:none}}
        @media(max-width:720px){.scroll-hud{display:none}}
      `;
      document.head.appendChild(st);
    }

    // Create DOM elements if page didn't pre-render them
    let progressBar = document.getElementById('scroll-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'scroll-progress';
      document.body.prepend(progressBar);
    }

    let canvas = document.getElementById('scroll-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'scroll-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }

    let stageLabel = document.getElementById('scrollStageLabel');
    if (!stageLabel) {
      const hud = document.createElement('div');
      hud.className = 'scroll-hud';
      hud.id = 'scrollHud';
      hud.innerHTML = '<span class="scroll-hud-dot"></span><span id="scrollStageLabel">STAGE 01 // ASSEMBLED DATA CORE · 0%</span>';
      document.body.appendChild(hud);
      stageLabel = document.getElementById('scrollStageLabel');
    }

    // IntersectionObserver for .reveal elements
    const revEls = document.querySelectorAll('.reveal');
    if (revEls.length) {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
          entries.forEach(en => { if (en.isIntersecting) en.target.classList.add('in'); });
        }, { threshold: 0.08 });
        revEls.forEach(el => io.observe(el));
      } else {
        revEls.forEach(el => el.classList.add('in'));
      }
    }

    const ctx = canvas.getContext('2d');
    const NODES = 54;
    const particles = Array.from({ length: NODES }, (_, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / NODES);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return {
        sx: Math.sin(phi) * Math.cos(theta),
        sy: Math.sin(phi) * Math.sin(theta),
        sz: Math.cos(phi),
        layer: i % 3,
        angle: (i / NODES) * Math.PI * 2 * 3,
        lane: (i % 5) - 2,
        phase: (i / NODES)
      };
    });

    let targetScroll = 0;
    let smoothScroll = 0;
    let timeTick = 0;

    function updateScrollTarget() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetScroll = Math.min(1, Math.max(0, window.scrollY / max));
      progressBar.style.width = (targetScroll * 100).toFixed(1) + '%';

      const pct = Math.round(targetScroll * 100);
      let label = 'STAGE 01 // ASSEMBLED DATA CORE';
      if (targetScroll >= 0.72) label = 'STAGE 04 // CORTEX NEURAL CONSTELLATION';
      else if (targetScroll >= 0.42) label = 'STAGE 03 // STREAMING PIPELINES';
      else if (targetScroll >= 0.16) label = 'STAGE 02 // 3-LAYER ARCHITECTURE';
      stageLabel.textContent = `${label} · ${pct}%`;
    }

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(v) { return Math.min(1, Math.max(0, v)); }

    function drawFrame() {
      timeTick += 0.008;
      smoothScroll += (targetScroll - smoothScroll) * 0.08;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const colIce = isDark ? 'rgba(76, 195, 240,' : 'rgba(10, 134, 194,';
      const colTeal = isDark ? 'rgba(63, 211, 168,' : 'rgba(11, 138, 106,';
      const colViolet = isDark ? 'rgba(167, 139, 250,' : 'rgba(109, 40, 217,';

      const t12 = clamp01((smoothScroll - 0.08) / 0.22);
      const t23 = clamp01((smoothScroll - 0.36) / 0.22);
      const t34 = clamp01((smoothScroll - 0.68) / 0.24);

      const cx = lerp(w * 0.74, w * 0.5, t12);
      const cy = h * 0.5;
      const radius = Math.min(w, h) * lerp(0.24, 0.32, t12);
      const rotY = timeTick + smoothScroll * Math.PI * 3.2;
      const rotX = 0.35 + Math.sin(smoothScroll * Math.PI) * 0.45;

      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const x1 = p.sx * radius;
        const y1 = p.sy * radius;
        const z1 = p.sz * radius;

        const ringR = radius * (0.75 + p.layer * 0.22);
        const x2 = Math.cos(p.angle + timeTick * (p.layer + 1) * 0.35) * ringR;
        const y2 = (p.layer - 1) * (radius * 0.52);
        const z2 = Math.sin(p.angle + timeTick * (p.layer + 1) * 0.35) * ringR;

        const flowX = ((p.phase + timeTick * 0.12 + smoothScroll * 0.9) % 1) * w - w * 0.5;
        const flowY = p.lane * (h * 0.13) + Math.sin(flowX * 0.008 + timeTick * 2 + p.lane) * 42;
        const flowZ = Math.cos(flowX * 0.006 + p.lane) * 60;

        const a4 = p.angle + timeTick * 0.5;
        const r4 = radius * (0.6 + (i % 4) * 0.18);
        const x4 = Math.cos(a4) * r4;
        const y4 = Math.sin(a4) * r4 * 0.7;
        const z4 = Math.sin(a4 * 2 + timeTick) * 90;

        let x = lerp(x1, x2, t12);
        let y = lerp(y1, y2, t12);
        let z = lerp(z1, z2, t12);

        x = lerp(x, flowX, t23);
        y = lerp(y, flowY, t23);
        z = lerp(z, flowZ, t23);

        x = lerp(x, x4, t34);
        y = lerp(y, y4, t34);
        z = lerp(z, z4, t34);

        const rotBlend = 1 - t23 * (1 - t34) * 0.75;
        const ry = rotY * rotBlend;
        const rx = rotX * rotBlend;

        const cosY = Math.cos(ry), sinY = Math.sin(ry);
        const rx1 = x * cosY - z * sinY;
        const rz1 = x * sinY + z * cosY;

        const cosX = Math.cos(rx), sinX = Math.sin(rx);
        const ry2 = y * cosX - rz1 * sinX;
        const rz2 = y * sinX + rz1 * cosX;

        const scale = 680 / (680 + rz2);
        projected.push({
          px: cx + rx1 * scale,
          py: cy + ry2 * scale,
          scale,
          layer: p.layer
        });
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i], b = projected[j];
          const dx = a.px - b.px, dy = a.py - b.py;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * (isDark ? 0.24 : 0.16);
            ctx.strokeStyle = (a.layer === 1 ? colTeal : a.layer === 2 ? colViolet : colIce) + alpha.toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < projected.length; i++) {
        const n = projected[i];
        const r = Math.max(1.8, 3.6 * n.scale);
        const alpha = Math.min(0.65, 0.22 + n.scale * 0.22);
        const c = n.layer === 1 ? colTeal : n.layer === 2 ? colViolet : colIce;
        ctx.fillStyle = c + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(n.px, n.py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(drawFrame);
    }

    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    updateScrollTarget();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      requestAnimationFrame(drawFrame);
    }

    // Optional typewriter if #typewriter exists (cycling if data-phrases is provided, or one-shot type-in on modules)
    const twEl = document.getElementById('typewriter');
    if (twEl && !reduceMotion) {
      let phrases = null;
      try {
        if (twEl.dataset.phrases) phrases = JSON.parse(twEl.dataset.phrases);
      } catch (e) {}

      if (Array.isArray(phrases) && phrases.length > 1) {
        let pIdx = 0, cIdx = phrases[0].length, deleting = true;
        const stepTypewriter = () => {
          const word = phrases[pIdx];
          if (deleting) {
            cIdx--;
            twEl.textContent = word.slice(0, cIdx);
            if (cIdx <= 0) {
              deleting = false;
              pIdx = (pIdx + 1) % phrases.length;
              setTimeout(stepTypewriter, 350);
              return;
            }
            setTimeout(stepTypewriter, 45);
          } else {
            cIdx++;
            twEl.textContent = word.slice(0, cIdx);
            if (cIdx >= word.length) {
              deleting = true;
              setTimeout(stepTypewriter, 1900);
              return;
            }
            setTimeout(stepTypewriter, 75);
          }
        };
        setTimeout(stepTypewriter, 1800);
      } else {
        // One-shot smooth typewriter reveal for module hero subtitles/titles
        const full = twEl.textContent;
        if (full.length > 0 && full.length < 80) {
          twEl.textContent = '';
          let idx = 0;
          const typeOne = () => {
            idx++;
            twEl.textContent = full.slice(0, idx);
            if (idx < full.length) setTimeout(typeOne, 32);
          };
          setTimeout(typeOne, 150);
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollStage);
  } else {
    initScrollStage();
  }
})();
