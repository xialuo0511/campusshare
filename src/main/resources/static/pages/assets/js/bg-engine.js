// Cursor-driven background engine for CampusShare login.
// 5 modes: aurora, spotlight, constellation, mesh, depth.
// Exposes window.BGEngine = { setMode, setAccent, setIntensity, destroy }.

(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');

  // ---------- state ----------
  const state = {
    mode: 'aurora',
    accent: '#005d90',
    accent2: '#3454d1',
    intensity: 1,
    dark: false,
    DPR: Math.min(window.devicePixelRatio || 1, 2),
    w: 0, h: 0,
    // raw + smoothed mouse
    mx: 0.5, my: 0.5,
    smx: 0.5, smy: 0.5,
    // tilt (in [-1, 1])
    tx: 0, ty: 0,
    raf: 0,
    t: 0,
  };

  // ---------- resize ----------
  function resize() {
    state.DPR = Math.min(window.devicePixelRatio || 1, 2);
    state.w = window.innerWidth;
    state.h = window.innerHeight;
    canvas.width = state.w * state.DPR;
    canvas.height = state.h * state.DPR;
    canvas.style.width = state.w + 'px';
    canvas.style.height = state.h + 'px';
    ctx.setTransform(state.DPR, 0, 0, state.DPR, 0, 0);

    // Reinit per-mode caches
    initParticles();
    initMesh();
    initDepth();
  }
  window.addEventListener('resize', resize);

  // ---------- pointer ----------
  function onMove(e) {
    const t = e.touches ? e.touches[0] : e;
    state.mx = t.clientX / state.w;
    state.my = t.clientY / state.h;
    state.tx = (state.mx - 0.5) * 2;
    state.ty = (state.my - 0.5) * 2;
  }
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  // ---------- helpers ----------
  function hexToRgb(h) {
    const m = h.replace('#', '');
    const n = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(rgb, a) { return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; }

  // ---------- AURORA: drifting gradient blobs that lerp toward cursor ----------
  const blobs = [];
  function initBlobs() {
    blobs.length = 0;
    const palette = state.dark
      ? [state.accent, state.accent2, '#0a8a4f', '#7e3ff2']
      : [state.accent, state.accent2, '#0a8a4f', '#b45309'];
    const count = 5;
    for (let i = 0; i < count; i++) {
      blobs.push({
        bx: Math.random(),  // base position
        by: Math.random(),
        x: Math.random(),
        y: Math.random(),
        r: 280 + Math.random() * 280,
        col: palette[i % palette.length],
        amp: 0.04 + Math.random() * 0.08,
        speed: 0.0002 + Math.random() * 0.00035,
        phase: Math.random() * Math.PI * 2,
        // how much each blob is pulled by cursor (parallax depth)
        pull: 0.05 + (i / count) * 0.18,
      });
    }
  }
  function drawAurora(dt) {
    // base wash
    ctx.fillStyle = state.dark ? '#060912' : '#f4f6fa';
    ctx.fillRect(0, 0, state.w, state.h);

    ctx.globalCompositeOperation = state.dark ? 'lighter' : 'multiply';
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      // gentle organic drift
      const dx = Math.sin(state.t * b.speed + b.phase) * b.amp;
      const dy = Math.cos(state.t * b.speed * 1.3 + b.phase) * b.amp;
      // parallax pull toward cursor
      const tx = b.bx + dx + state.tx * b.pull;
      const ty = b.by + dy + state.ty * b.pull;
      // smooth
      b.x += (tx - b.x) * 0.06;
      b.y += (ty - b.y) * 0.06;

      const cx = b.x * state.w;
      const cy = b.y * state.h;
      const r = b.r * state.intensity;
      const rgb = hexToRgb(b.col);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, rgba(rgb, state.dark ? 0.55 : 0.32));
      g.addColorStop(0.5, rgba(rgb, state.dark ? 0.18 : 0.10));
      g.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // subtle grain
    drawGrain(0.025);
  }

  // ---------- SPOTLIGHT: dim wash with bright radial at cursor ----------
  function drawSpotlight() {
    // base
    const baseRGB = state.dark ? hexToRgb('#06121f') : hexToRgb('#0d2238');
    if (state.dark) {
      ctx.fillStyle = '#04070f';
      ctx.fillRect(0, 0, state.w, state.h);
    } else {
      // soft light base
      const bg = ctx.createLinearGradient(0, 0, 0, state.h);
      bg.addColorStop(0, '#e7eef6');
      bg.addColorStop(1, '#f4f6fa');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, state.w, state.h);
    }

    // smooth cursor
    state.smx += (state.mx - state.smx) * 0.12;
    state.smy += (state.my - state.smy) * 0.12;

    const cx = state.smx * state.w;
    const cy = state.smy * state.h;

    // big halo (outer color)
    const r1 = Math.max(state.w, state.h) * 0.6 * state.intensity;
    const rgb2 = hexToRgb(state.accent2);
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1);
    halo.addColorStop(0, rgba(rgb2, state.dark ? 0.45 : 0.22));
    halo.addColorStop(0.55, rgba(rgb2, 0.05));
    halo.addColorStop(1, rgba(rgb2, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, state.w, state.h);

    // inner spot (accent)
    const r2 = 360 * state.intensity;
    const rgb1 = hexToRgb(state.accent);
    const spot = ctx.createRadialGradient(cx, cy, 0, cx, cy, r2);
    spot.addColorStop(0, rgba(rgb1, state.dark ? 0.55 : 0.30));
    spot.addColorStop(1, rgba(rgb1, 0));
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, state.w, state.h);

    // grid lines
    drawGridLines(state.dark ? 0.06 : 0.04);

    // soft vignette dark
    if (state.dark) {
      const v = ctx.createRadialGradient(state.w/2, state.h/2, Math.min(state.w, state.h)*0.3, state.w/2, state.h/2, Math.max(state.w, state.h)*0.8);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, state.w, state.h);
    }
  }

  // ---------- CONSTELLATION: particles, lines, attracted to cursor ----------
  let particles = [];
  function initParticles() {
    const density = Math.floor((state.w * state.h) / 14000);
    particles = [];
    for (let i = 0; i < density; i++) {
      particles.push({
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1 + Math.random() * 1.6,
      });
    }
  }
  function drawConstellation() {
    // backdrop
    if (state.dark) {
      const g = ctx.createLinearGradient(0, 0, state.w, state.h);
      g.addColorStop(0, '#040810');
      g.addColorStop(1, '#0a1426');
      ctx.fillStyle = g;
    } else {
      const g = ctx.createLinearGradient(0, 0, state.w, state.h);
      g.addColorStop(0, '#f4f6fa');
      g.addColorStop(1, '#eaf1f8');
      ctx.fillStyle = g;
    }
    ctx.fillRect(0, 0, state.w, state.h);

    const cx = state.mx * state.w;
    const cy = state.my * state.h;
    const pullR = 220 * state.intensity;
    const lineR = 130 * state.intensity;

    // update particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // gentle attraction to cursor when nearby
      const dx = cx - p.x;
      const dy = cy - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < pullR * pullR) {
        const d = Math.sqrt(d2) + 0.01;
        const force = (1 - d / pullR) * 0.08;
        p.vx += (dx / d) * force;
        p.vy += (dy / d) * force;
      }
      // damping
      p.vx *= 0.96;
      p.vy *= 0.96;
      // drift baseline
      p.vx += (Math.random() - 0.5) * 0.02;
      p.vy += (Math.random() - 0.5) * 0.02;
      p.x += p.vx;
      p.y += p.vy;
      // wrap
      if (p.x < -10) p.x = state.w + 10;
      if (p.x > state.w + 10) p.x = -10;
      if (p.y < -10) p.y = state.h + 10;
      if (p.y > state.h + 10) p.y = -10;
    }

    // connecting lines
    const accentRGB = hexToRgb(state.accent);
    const dotRGB = state.dark ? [200, 220, 255] : hexToRgb(state.accent);

    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < lineR * lineR) {
          const d = Math.sqrt(d2);
          const alpha = (1 - d / lineR) * (state.dark ? 0.45 : 0.30);
          ctx.strokeStyle = rgba(accentRGB, alpha);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // particle bright if near cursor
      const dxc = cx - a.x, dyc = cy - a.y;
      const dc = Math.sqrt(dxc * dxc + dyc * dyc);
      const glow = Math.max(0, 1 - dc / pullR);
      ctx.fillStyle = rgba(dotRGB, (state.dark ? 0.7 : 0.55) + glow * 0.4);
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r + glow * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // cursor halo
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, pullR);
    halo.addColorStop(0, rgba(accentRGB, state.dark ? 0.25 : 0.16));
    halo.addColorStop(1, rgba(accentRGB, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, state.w, state.h);
  }

  // ---------- MESH: grid that distorts toward cursor ----------
  let mesh = { cols: 0, rows: 0, gx: 28 };
  function initMesh() {
    mesh.gx = 36;
    mesh.cols = Math.ceil(state.w / mesh.gx) + 2;
    mesh.rows = Math.ceil(state.h / mesh.gx) + 2;
  }
  function drawMesh() {
    // backdrop
    if (state.dark) {
      const g = ctx.createRadialGradient(state.w/2, state.h*0.3, 0, state.w/2, state.h*0.3, state.h);
      g.addColorStop(0, '#0a1426');
      g.addColorStop(1, '#04060c');
      ctx.fillStyle = g;
    } else {
      const g = ctx.createRadialGradient(state.w/2, state.h*0.4, 0, state.w/2, state.h*0.4, state.h);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#eaf1f8');
      ctx.fillStyle = g;
    }
    ctx.fillRect(0, 0, state.w, state.h);

    const cx = state.mx * state.w;
    const cy = state.my * state.h;
    const R = 220 * state.intensity;
    const strength = 60 * state.intensity;

    const accentRGB = hexToRgb(state.accent);

    // compute displaced points
    const pts = [];
    for (let r = 0; r < mesh.rows; r++) {
      pts[r] = [];
      for (let c = 0; c < mesh.cols; c++) {
        const x = c * mesh.gx;
        const y = r * mesh.gx;
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        let nx = x, ny = y;
        if (d < R && d > 0.001) {
          // outward push, falling off with distance
          const k = Math.cos((d / R) * (Math.PI / 2)); // 1 → 0
          nx = x + (dx / d) * k * strength;
          ny = y + (dy / d) * k * strength;
        }
        pts[r][c] = { x: nx, y: ny, d };
      }
    }

    // draw grid lines (column then row)
    ctx.lineWidth = 1;
    for (let c = 0; c < mesh.cols; c++) {
      ctx.beginPath();
      for (let r = 0; r < mesh.rows; r++) {
        const p = pts[r][c];
        const alpha = Math.max(0.04, Math.min(0.45, 1 - p.d / (R * 2.5))) * (state.dark ? 0.7 : 0.55);
        if (r === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = rgba(accentRGB, alpha);
      }
      ctx.stroke();
    }
    for (let r = 0; r < mesh.rows; r++) {
      ctx.beginPath();
      for (let c = 0; c < mesh.cols; c++) {
        const p = pts[r][c];
        if (c === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = rgba(accentRGB, state.dark ? 0.18 : 0.12);
      ctx.stroke();
    }

    // dots at intersections near cursor
    for (let r = 0; r < mesh.rows; r++) {
      for (let c = 0; c < mesh.cols; c++) {
        const p = pts[r][c];
        if (p.d < R) {
          const k = 1 - p.d / R;
          ctx.fillStyle = rgba(accentRGB, 0.6 * k);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5 + k * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // cursor halo
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    halo.addColorStop(0, rgba(accentRGB, state.dark ? 0.22 : 0.14));
    halo.addColorStop(1, rgba(accentRGB, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, state.w, state.h);
  }

  // ---------- DEPTH: parallax floating shapes (campus-y icons) ----------
  let depthShapes = [];
  function initDepth() {
    depthShapes = [];
    const N = 26;
    const shapes = ['ring', 'book', 'tag', 'square', 'dot', 'badge'];
    for (let i = 0; i < N; i++) {
      const layer = Math.random(); // 0 (back) → 1 (front)
      depthShapes.push({
        kind: shapes[i % shapes.length],
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        s: 10 + layer * 56 + Math.random() * 20,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.003,
        layer,
        drift: (Math.random() - 0.5) * 0.15,
      });
    }
    depthShapes.sort((a, b) => a.layer - b.layer);
  }
  function drawDepth() {
    // backdrop
    if (state.dark) {
      const g = ctx.createLinearGradient(0, 0, 0, state.h);
      g.addColorStop(0, '#080d1a');
      g.addColorStop(1, '#03050c');
      ctx.fillStyle = g;
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, state.h);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.6, '#eef2f7');
      g.addColorStop(1, '#dbe5f0');
      ctx.fillStyle = g;
    }
    ctx.fillRect(0, 0, state.w, state.h);

    const cx = state.mx * state.w;
    const cy = state.my * state.h;
    const accentRGB = hexToRgb(state.accent);
    const accent2RGB = hexToRgb(state.accent2);

    // distant blur tint
    const tint = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(state.w, state.h) * 0.55);
    tint.addColorStop(0, rgba(accentRGB, state.dark ? 0.30 : 0.18));
    tint.addColorStop(1, rgba(accentRGB, 0));
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, state.w, state.h);

    for (let i = 0; i < depthShapes.length; i++) {
      const sp = depthShapes[i];
      sp.rot += sp.spin;
      sp.y += sp.drift * (0.3 + sp.layer * 0.7);
      if (sp.y > state.h + 60) sp.y = -60;
      if (sp.y < -60) sp.y = state.h + 60;

      // parallax offset based on layer
      const px = sp.x - state.tx * (10 + sp.layer * 90);
      const py = sp.y - state.ty * (10 + sp.layer * 90);

      const alpha = state.dark
        ? 0.18 + sp.layer * 0.5
        : 0.10 + sp.layer * 0.36;
      const col = sp.layer > 0.7 ? accent2RGB : accentRGB;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(sp.rot);
      ctx.strokeStyle = rgba(col, alpha);
      ctx.fillStyle = rgba(col, alpha * 0.6);
      ctx.lineWidth = 1 + sp.layer * 1.5;
      drawShape(sp.kind, sp.s, sp.layer);
      ctx.restore();
    }

    // foreground halo
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 320 * state.intensity);
    halo.addColorStop(0, rgba(accent2RGB, state.dark ? 0.20 : 0.10));
    halo.addColorStop(1, rgba(accent2RGB, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, state.w, state.h);
  }
  function drawShape(kind, s, layer) {
    const half = s / 2;
    switch (kind) {
      case 'ring':
        ctx.beginPath();
        ctx.arc(0, 0, half, 0, Math.PI * 2);
        ctx.stroke();
        if (layer > 0.6) {
          ctx.beginPath();
          ctx.arc(0, 0, half * 0.55, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      case 'book':
        ctx.strokeRect(-half * 0.7, -half, s * 0.7, s);
        ctx.beginPath();
        ctx.moveTo(0, -half); ctx.lineTo(0, half);
        ctx.stroke();
        break;
      case 'tag':
        ctx.beginPath();
        ctx.moveTo(-half, -half * 0.4);
        ctx.lineTo(half * 0.5, -half * 0.4);
        ctx.lineTo(half, 0);
        ctx.lineTo(half * 0.5, half * 0.4);
        ctx.lineTo(-half, half * 0.4);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-half * 0.55, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.strokeRect(-half, -half, s, s);
        break;
      case 'dot':
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1.5, s * 0.08), 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'badge':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(a) * half;
          const y = Math.sin(a) * half;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        break;
    }
  }

  // ---------- shared decorations ----------
  function drawGridLines(alpha) {
    ctx.strokeStyle = `rgba(120,140,170,${alpha})`;
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = (state.t * 0.02) % step; x < state.w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, state.h);
      ctx.stroke();
    }
    for (let y = 0; y < state.h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(state.w, y);
      ctx.stroke();
    }
  }
  function drawGrain(alpha) {
    // sparse "grain" via a single ImageData blit would be heavy — instead, soft noise dots
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.6})`;
    for (let i = 0; i < 30; i++) {
      ctx.fillRect(Math.random() * state.w, Math.random() * state.h, 1, 1);
    }
  }

  // ---------- loop ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(64, now - last);
    last = now;
    state.t += dt;

    ctx.clearRect(0, 0, state.w, state.h);
    switch (state.mode) {
      case 'spotlight': drawSpotlight(); break;
      case 'constellation': drawConstellation(); break;
      case 'mesh': drawMesh(); break;
      case 'depth': drawDepth(); break;
      default: drawAurora(dt);
    }

    state.raf = requestAnimationFrame(loop);
  }

  // ---------- public API ----------
  window.BGEngine = {
    setMode(m) {
      state.mode = m;
      if (m === 'constellation') initParticles();
      if (m === 'depth') initDepth();
    },
    setAccent(c, c2) {
      state.accent = c;
      if (c2) state.accent2 = c2;
      initBlobs();
    },
    setIntensity(v) { state.intensity = v; },
    setDark(v) {
      state.dark = !!v;
      document.body.classList.toggle('dark-skin', !!v);
      initBlobs();
    },
  };

  // ---------- boot ----------
  initBlobs();
  resize();
  state.raf = requestAnimationFrame(loop);
})();
