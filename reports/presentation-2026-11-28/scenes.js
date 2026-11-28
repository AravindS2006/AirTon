/* AirTon deck scenes: the applanation simulator ported from src/airton/ml/acquisition.py,
   the deterministic rules from src/airton/ml/quality.py, animated diagrams and to-scale charts.
   Every number drawn in a chart comes from the repository's records. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const deck = () => window.AIRTON || { sfx() {}, bg: { pulse() {} } };
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  function svg(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ============================================================ simulator */
  function rng(seed) {
    let a = seed >>> 0, spare = null;
    const u = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    u.g = () => {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let x, y, r; do { x = u() * 2 - 1; y = u() * 2 - 1; r = x * x + y * y; } while (!r || r >= 1);
      const m = Math.sqrt(-2 * Math.log(r) / r); spare = y * m; return x * m;
    };
    return u;
  }
  const N = 320, DT = 0.1; // 10 kHz, 32 ms window
  function simulate(o, seed = 7) {
    const R = rng(seed), g = R.g;
    const amp = 72 * (1 + 0.015 * g()), sig = 4.5, t0 = 16;
    const lat = o.lat || 0, ax = o.ax || 0;
    const eff = clamp(1 - 0.032 * lat * lat - 0.025 * Math.abs(ax), 0.45, 1);
    const tau = o.tau ?? 0.55, a = 1 - Math.exp(-DT / tau);
    const Rc = 0.04 * ((o.cct ?? 545) - 545) + 1.2 * (o.zs || 0);
    const T = o.iop + Rc;
    const w = 3.5 * (1 + 0.35 * lat);
    const alignAmp = Math.exp(-((lat / 2) ** 2)) * Math.exp(-((ax / 3) ** 2));
    const gain = 0.70 * (o.gain ?? 1) * (1 + 0.04 * g());
    const phase = R() * 2 * Math.PI, ambient = 0.02 + 0.06 * R(), flick = o.flicker ?? 0.004;
    const bStart = 6 + 12 * R(), lid = 0.55 + 0.35 * R();
    const noise = o.noise ?? 1;
    const t = [], pulse = [], pressure = [], y = [], optical = [], ref = [];
    let yy = 0;
    for (let i = 0; i < N; i++) {
      const ti = i * DT;
      const p = amp * Math.exp(-0.5 * ((ti - t0) / sig) ** 2);
      const x = eff * p;
      yy = i === 0 ? x : a * x + (1 - a) * yy;
      let refl = alignAmp * Math.exp(-(((yy - T) / w) ** 2)) + 0.03;
      if (o.blink) { const occ = 1 / (1 + Math.exp(-(ti - bStart) / 0.6)); refl = refl * (1 - occ) + lid * occ; }
      let ov = gain * refl + ambient + flick * Math.sin(2 * Math.PI * 0.1 * ti + phase) + 0.010 * g() * noise;
      ov = Math.round(clamp(ov, 0, 1) * 4095) / 4095;
      const pv = Math.round((p + 0.22 * g() * noise) / 0.05) * 0.05;
      t.push(ti); pulse.push(p); pressure.push(pv); y.push(yy); optical.push(ov); ref.push(refl);
    }
    return { t, pulse, pressure, y, optical, ref, T, Rc, eff, amp, gain };
  }

  /* ============================================================ features + rules (iop-features-1, simplified) */
  const DES = (() => {
    const rows = [], tm = (N - 1) * DT / 2000;
    for (let i = 0; i < N; i++) {
      const ts = i * DT / 1000;
      rows.push([1, ts - tm, Math.sin(2 * Math.PI * 100 * ts), Math.cos(2 * Math.PI * 100 * ts), Math.sin(2 * Math.PI * 200 * ts), Math.cos(2 * Math.PI * 200 * ts)]);
    }
    return rows;
  })();
  function solve(M, b) {
    const n = b.length, A = M.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]];
      const d = A[c][c] || 1e-12;
      for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / d; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((r, i) => r[n] / (r[i] || 1e-12));
  }
  const median = arr => { const s = [...arr].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  function conditionOptical(x) {
    let w = new Array(N).fill(1), coef = [0, 0, 0, 0, 0, 0];
    for (let it = 0; it < 3; it++) {
      const M = Array.from({ length: 6 }, () => new Array(6).fill(0)), b = new Array(6).fill(0);
      for (let i = 0; i < N; i++) { const r = DES[i]; for (let j = 0; j < 6; j++) { b[j] += w[i] * r[j] * x[i]; for (let k = 0; k < 6; k++) M[j][k] += w[i] * r[j] * r[k]; } }
      coef = solve(M, b);
      const res = x.map((v, i) => v - DES[i].reduce((s, d, j) => s + d * coef[j], 0));
      const med = median(res), mad = median(res.map(r => Math.abs(r - med))) + 1e-9;
      w = res.map(r => (Math.abs(r) < 3 * 1.4826 * mad ? 1 : 0) + 1e-3);
    }
    let c = x.map((v, i) => v - DES[i].reduce((s, d, j) => s + d * coef[j], 0));
    for (let pass = 0; pass < 2; pass++) c = c.map((v, i) => 0.25 * (c[i - 1] ?? v) + 0.5 * v + 0.25 * (c[i + 1] ?? v));
    return c;
  }
  function parabolic(y, i) {
    if (i > 0 && i < y.length - 1) { const d = y[i - 1] - 2 * y[i] + y[i + 1]; if (d !== 0) return clamp(0.5 * (y[i - 1] - y[i + 1]) / d, -0.5, 0.5); }
    return 0;
  }
  function interp(arr, idxF) { const i = Math.floor(idxF), f = idxF - i; return arr[i] + ((arr[i + 1] ?? arr[i]) - arr[i]) * f; }
  function extract(sim, meta) {
    const p = sim.pressure, o = sim.optical;
    const ps = p.map((v, i) => { let s = 0, n = 0; for (let k = -2; k <= 2; k++) { const q = p[i + k]; if (q !== undefined) { s += q; n++; } } return s / n; });
    let iPeak = 0; ps.forEach((v, i) => { if (v > ps[iPeak]) iPeak = i; });
    const stimulus = ps[iPeak] > 5;
    const cleaned = conditionOptical(o);
    const diffs = []; for (let i = 1; i < N; i++) diffs.push(Math.abs(cleaned[i] - cleaned[i - 1]));
    const noiseMad = 1.4826 * median(diffs) / Math.SQRT2 + 1e-6;
    const saturation = o.filter(v => v >= 0.999).length / N;
    const p5 = [...o].sort((a, b) => a - b)[Math.floor(0.05 * N)];
    let broadN = 0;
    for (let i = 0; i < N; i++) { let s = 0; for (let k = -25; k < 25; k++) { const q = o[i + k]; if (q !== undefined) s += q - p5; } if (s / 50 > 0.25) broadN++; }
    const broad = broadN / N;
    const base = median(cleaned);
    const f = { stimulus, saturation, broad, noiseMad, events: false, snr: NaN, p1: NaN, p2: NaN, t1: NaN, t2: NaN, lat: meta.lat, ax: meta.ax };
    if (!stimulus) return f;
    let i1 = 0, i2 = iPeak + 1;
    for (let i = 0; i < iPeak; i++) if (cleaned[i] > cleaned[i1]) i1 = i;
    for (let i = iPeak + 1; i < N; i++) if (cleaned[i] > cleaned[i2]) i2 = i;
    const pr1 = cleaned[i1] - base, pr2 = cleaned[i2] - base, minProm = Math.max(6 * noiseMad, 0.02);
    if (!(pr1 >= minProm && pr2 >= minProm)) return f;
    const ti1 = i1 + parabolic(cleaned, i1), ti2 = i2 + parabolic(cleaned, i2);
    Object.assign(f, { events: true, snr: Math.min(pr1, pr2) / noiseMad, t1: ti1 * DT, t2: ti2 * DT, p1: interp(ps, ti1), p2: interp(ps, ti2) });
    return f;
  }
  const LIMITS = { max_lateral_mm: 1, max_axial_mm: 1.5, max_broad_fraction: 0.3, max_saturation_fraction: 0.004, min_snr: 20 };
  function rules(f) {
    const r = new Set();
    if (!f.events) r.add('signal_missing');
    if (Math.abs(f.lat) > LIMITS.max_lateral_mm || Math.abs(f.ax) > LIMITS.max_axial_mm) r.add('alignment');
    if (f.broad > LIMITS.max_broad_fraction) r.add('blink');
    if (f.saturation > LIMITS.max_saturation_fraction) r.add('signal_quality');
    if (f.events && !(f.snr >= LIMITS.min_snr)) r.add('signal_quality');
    return [...r].sort();
  }
  const path = (xs, ys) => xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join('');

  const S = {};

  /* ============================================================ title */
  S.title = {
    timers: [],
    enter() {
      this.leave();
      if (reduce) return;
      this.timers.push(setTimeout(() => deck().sfx('puff'), 720));
      this.timers.push(setTimeout(() => deck().bg.pulse(1), 980));
    },
    leave() { this.timers.forEach(clearTimeout); this.timers = []; }
  };
  S.close = {
    timers: [],
    enter() { this.leave(); if (!reduce) this.timers.push(setTimeout(() => deck().bg.pulse(0.8), 500)); },
    leave() { this.timers.forEach(clearTimeout); this.timers = []; }
  };

  /* ============================================================ physics: cornea + oscilloscope */
  S.physics = {
    raf: 0,
    init() {
      const sim = simulate({ iop: 17, cct: 545, lat: 0.1, ax: 0.05, noise: 0.7 }, 11);
      const clean = simulate({ iop: 17, cct: 545, lat: 0.1, ax: 0.05, noise: 0 }, 11);
      this.sim = sim; this.clean = clean;
      const X0 = 80, X1 = 970, xs = sim.t.map(t => X0 + (t / 32) * (X1 - X0));
      const pY = v => 300 - (v / 80) * 260, oY = v => 520 - v * 150;
      this.xs = xs; this.pY = pY; this.oY = oY;
      $('#ph-p').setAttribute('d', path(xs, sim.pressure.map(pY)));
      $('#ph-o').setAttribute('d', path(xs, sim.optical.map(oY)));
      let iPk = 0; clean.pulse.forEach((v, i) => { if (v > clean.pulse[iPk]) iPk = i; });
      let i1 = 0, i2 = iPk + 1;
      for (let i = 0; i < iPk; i++) if (clean.ref[i] > clean.ref[i1]) i1 = i;
      for (let i = iPk + 1; i < N; i++) if (clean.ref[i] > clean.ref[i2]) i2 = i;
      const P1 = clean.pulse[i1], P2 = clean.pulse[i2];
      this.i1 = i1; this.i2 = i2;
      const place = (id, i, P, lbl) => {
        const g = $(id);
        g.querySelector('line.v').setAttribute('x1', xs[i]); g.querySelector('line.v').setAttribute('x2', xs[i]);
        g.querySelector('line.h').setAttribute('x1', X0); g.querySelector('line.h').setAttribute('x2', xs[i]);
        g.querySelector('line.h').setAttribute('y1', pY(P)); g.querySelector('line.h').setAttribute('y2', pY(P));
        g.querySelector('circle').setAttribute('cx', xs[i]); g.querySelector('circle').setAttribute('cy', pY(P));
        const tx = g.querySelector('text');
        tx.setAttribute('x', xs[i] + (lbl === 'P1' ? -14 : 14)); tx.setAttribute('y', pY(P) - 14);
        tx.setAttribute('text-anchor', lbl === 'P1' ? 'end' : 'start');
        tx.textContent = `${lbl} = ${P.toFixed(1)} mmHg`;
      };
      place('#ph-m1', i1, P1, 'P1'); place('#ph-m2', i2, P2, 'P2');
      const mid = (P1 + P2) / 2;
      const ml = $('#ph-mid');
      ml.querySelector('line').setAttribute('y1', pY(mid)); ml.querySelector('line').setAttribute('y2', pY(mid));
      ml.querySelector('text').setAttribute('y', pY(mid) + 30);
      ml.querySelector('text').textContent = `½(P1+P2) = ${mid.toFixed(1)} ≈ IOP + Rc = ${clean.T.toFixed(1)}   ·   hysteresis P1 − P2 = ${(P1 - P2).toFixed(1)} mmHg`;
      const hy = $('#ph-hyst');
      const hx = X1 - 10;
      hy.querySelector('path').setAttribute('d', `M${hx - 12},${pY(P1)} L${hx},${pY(P1)} L${hx},${pY(P2)} L${hx - 12},${pY(P2)}`);
      this.draw(reduce ? 1 : 1);
    },
    draw(prog) {
      const k = clamp(Math.round(prog * (N - 1)), 0, N - 1);
      const s = this.clean, sn = this.sim;
      const X0 = 80, X1 = 970, xc = X0 + prog * (X1 - X0);
      $('#ph-clip').setAttribute('width', Math.max(0, xc - X0 + 2));
      $('#ph-cursor').setAttribute('x1', xc); $('#ph-cursor').setAttribute('x2', xc);
      $('#ph-time').textContent = `t = ${(k * DT).toFixed(1)} ms`;
      const yv = s.y[k], T = s.T;
      const c = yv < T ? 1 - yv / T : -0.55 * (1 - Math.exp(-(yv - T) / 12));
      const bulge = 118 * c, ax = 420 - bulge, cx = 420 - 2 * bulge;
      $('#ph-cornea').setAttribute('d', `M420,110 Q${cx},330 420,550`);
      $('#ph-cornea-in').setAttribute('d', `M436,122 Q${cx + 30},330 436,538`);
      $('#ph-chamber').setAttribute('d', `M420,110 Q${cx},330 420,550 L470,520 L470,140 Z`);
      const pr = s.pulse[k] / s.amp;
      $('#ph-air').style.opacity = (0.08 + 0.92 * pr).toFixed(3);
      $('#ph-air').setAttribute('transform', `translate(${(1 - pr) * -40},0)`);
      const refN = clamp((sn.optical[k] - 0.06) / 0.72, 0, 1);
      ['#ph-bi', '#ph-bo'].forEach(id => { $(id).setAttribute('x2', ax); });
      $('#ph-bi').setAttribute('y2', 330); $('#ph-bo').setAttribute('y2', 330);
      $('#ph-bo').style.opacity = (0.06 + 0.94 * refN).toFixed(3);
      $('#ph-det').style.opacity = (0.25 + 0.75 * refN).toFixed(3);
      $('#ph-det-glow').setAttribute('r', (8 + 30 * refN).toFixed(1));
      $('#ph-det-glow').style.opacity = refN.toFixed(3);
      const state = Math.abs(yv - T) < 3.5 ? 'flat' : yv > T ? 'concave' : 'convex';
      $('#ph-state').textContent = state === 'flat' ? 'Applanation: flat' : state === 'concave' ? 'Pushed concave' : 'Natural curve';
      $('#ph-state').classList.toggle('hot', state === 'flat');
    },
    enter() {
      cancelAnimationFrame(this.raf);
      if (reduce) { this.draw(1); return; }
      const t0 = performance.now(), period = 6800, sweep = 4600, lead = 700;
      let lastFlash = -1;
      const loop = now => {
        const tt = (now - t0) % period;
        const prog = clamp((tt - lead) / sweep, 0, 1);
        this.draw(prog);
        const k = Math.round(prog * (N - 1));
        const cycle = Math.floor((now - t0) / period);
        if (k >= this.i1 && lastFlash < cycle * 2) { lastFlash = cycle * 2; deck().sfx('step'); }
        if (k >= this.i2 && lastFlash < cycle * 2 + 1) { lastFlash = cycle * 2 + 1; deck().sfx('step'); }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    },
    leave() { cancelAnimationFrame(this.raf); this.draw(1); },
    step(k) { $$('#physics .cap').forEach((c, i) => c.classList.toggle('cur', i === k)); }
  };

  /* ============================================================ sandbox */
  S.sandbox = {
    seed: 21,
    init() {
      const root = $('#sandbox');
      $$('input', root).forEach(inp => inp.addEventListener('input', () => this.update(false)));
      $('#sb-fire').addEventListener('click', () => { this.seed = (this.seed * 48271 + 11) % 2147483647; this.update(true); });
      $('#sb-reset').addEventListener('click', () => {
        const d = { 'sb-iop': 17, 'sb-cct': 545, 'sb-lat': 0.2, 'sb-ax': 0.2, 'sb-gain': 1, 'sb-flick': 0.004 };
        for (const id in d) $('#' + id).value = d[id];
        $('#sb-blink').checked = false; this.update(true);
      });
      this.update(false);
    },
    read() {
      const v = id => parseFloat($('#' + id).value);
      return { iop: v('sb-iop'), cct: v('sb-cct'), lat: v('sb-lat'), ax: v('sb-ax'), gain: v('sb-gain'), flicker: v('sb-flick'), blink: $('#sb-blink').checked };
    },
    update(fired) {
      const o = this.read();
      $('#sb-iop-v').textContent = `${o.iop.toFixed(0)} mmHg`;
      $('#sb-cct-v').textContent = `${o.cct.toFixed(0)} µm`;
      $('#sb-lat-v').textContent = `${o.lat.toFixed(1)} mm`;
      $('#sb-ax-v').textContent = `${o.ax.toFixed(1)} mm`;
      $('#sb-gain-v').textContent = `× ${o.gain.toFixed(2)}`;
      $('#sb-flick-v').textContent = o.flicker.toFixed(3);
      const sim = simulate(o, this.seed);
      const f = extract(sim, o);
      const reasons = rules(f);
      const X0 = 70, X1 = 1040, xs = sim.t.map(t => X0 + (t / 32) * (X1 - X0));
      const pY = v => 250 - clamp(v, -5, 90) / 90 * 220, oY = v => 450 - v * 170;
      $('#sb-p').setAttribute('d', path(xs, sim.pressure.map(pY)));
      $('#sb-o').setAttribute('d', path(xs, sim.optical.map(oY)));
      const tY = pY(sim.T);
      $('#sb-T').setAttribute('y1', tY); $('#sb-T').setAttribute('y2', tY);
      $('#sb-T-l').setAttribute('y', tY - 8);
      const mark = (id, t, P, show) => {
        const g = $(id); g.style.opacity = show ? 1 : 0;
        if (!show) return;
        const x = X0 + (t / 32) * (X1 - X0);
        g.querySelector('line').setAttribute('x1', x); g.querySelector('line').setAttribute('x2', x);
        g.querySelector('text').setAttribute('x', x); g.querySelector('text').textContent = `${id.endsWith('1') ? 'P1' : 'P2'} ${P.toFixed(1)}`;
      };
      mark('#sb-m1', f.t1, f.p1, f.events); mark('#sb-m2', f.t2, f.p2, f.events);
      $('#sb-r-p1').textContent = f.events ? fmt(f.p1) : '—';
      $('#sb-r-p2').textContent = f.events ? fmt(f.p2) : '—';
      $('#sb-r-mid').textContent = f.events ? fmt((f.p1 + f.p2) / 2) : '—';
      $('#sb-r-hys').textContent = f.events ? fmt(f.p1 - f.p2) : '—';
      $('#sb-r-snr').textContent = f.events ? fmt(f.snr, 0) : '—';
      $('#sb-r-T').textContent = `${fmt(sim.T)} = ${fmt(o.iop, 0)} ${sim.Rc >= 0 ? '+' : '−'} ${fmt(Math.abs(sim.Rc))}`;
      const v = $('#sb-verdict');
      const ok = reasons.length === 0;
      v.classList.toggle('ok', ok); v.classList.toggle('bad', !ok);
      $('#sb-v-state').textContent = ok ? 'Passes the rules' : 'Rejected';
      $('#sb-v-why').textContent = ok
        ? `Midpoint ${fmt((f.p1 + f.p2) / 2)} mmHg would go on to the learned gates and the estimator.`
        : `Reason${reasons.length > 1 ? 's' : ''}: ${reasons.join(', ')}. No pressure value is reported.`;
      if (fired) { deck().sfx(ok ? 'accept' : 'reject'); deck().bg.pulse(0.6); deck().sfx('puff'); }
    }
  };

  /* ============================================================ pipeline particles */
  S.pipeline = {
    raf: 0, parts: [], labels: [],
    gates: [
      { x: 500, p: 0.12, reasons: ['alignment', 'blink', 'calibration_expired', 'clock_untrusted', 'signal_missing'] },
      { x: 710, p: 0.08, reasons: ['signal_quality'] },
      { x: 920, p: 0.08, reasons: ['out_of_domain'] },
      { x: 1380, p: 0.09, reasons: ['estimate_uncertain'] }
    ],
    init() {
      const cv = $('#pl-canvas'); this.cv = cv; this.ctx = cv.getContext('2d');
      cv.width = 1664 * 2; cv.height = 380 * 2; this.ctx.scale(2, 2);
      this.col = { fluor: css('--fluor'), alarm: css('--alarm'), cobalt: css('--cobalt'), paper: css('--paper'), ember: css('--ember'), line: css('--line-2'), mute: css('--mute') };
      this.drawStatic(); this.renderFrame(0);
    },
    drawStatic() {},
    spawn() {
      const R = Math.random;
      this.parts.push({ x: -10, y: 190 + (R() - 0.5) * 120, vx: 230 + R() * 60, vy: 0, gate: 0, dead: false, rej: null, a: 1, hue: R() });
    },
    renderFrame(dt) {
      const c = this.ctx, col = this.col;
      c.clearRect(0, 0, 1664, 380);
      // flow band
      const grd = c.createLinearGradient(0, 0, 1664, 0);
      grd.addColorStop(0, 'rgba(91,140,255,0.05)'); grd.addColorStop(1, 'rgba(214,255,62,0.07)');
      c.fillStyle = grd; c.fillRect(0, 115, 1664, 150);
      // estimator chamber
      c.strokeStyle = col.line; c.lineWidth = 1.5; c.setLineDash([6, 6]);
      c.strokeRect(1010, 105, 290, 170); c.setLineDash([]);
      // gates
      for (const g of this.gates) {
        const gr = c.createLinearGradient(g.x - 14, 0, g.x + 14, 0);
        gr.addColorStop(0, 'rgba(255,84,112,0)'); gr.addColorStop(0.5, 'rgba(255,84,112,0.55)'); gr.addColorStop(1, 'rgba(255,84,112,0)');
        c.fillStyle = gr; c.fillRect(g.x - 14, 100, 28, 180);
        c.fillStyle = col.paper; c.fillRect(g.x - 1, 100, 2, 180);
      }
      // particles
      for (const p of this.parts) {
        if (dt) {
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (!p.rej) {
            const g = this.gates[p.gate];
            if (g && p.x >= g.x) {
              if (Math.random() < g.p) {
                p.rej = g.reasons[Math.floor(Math.random() * g.reasons.length)];
                p.vx *= 0.25; p.vy = 40;
                this.labels.push({ x: g.x + 12, y: 300, text: p.rej, a: 1 });
              } else p.gate++;
            }
          } else { p.vy += 900 * dt; p.a -= dt * 0.9; }
          if (p.x > 1650 && !p.rej) { p.dead = true; this.flash = 1; }
          if (p.a <= 0 || p.y > 400) p.dead = true;
        }
        c.globalAlpha = Math.max(0, p.a);
        const color = p.rej ? col.alarm : p.gate >= 3 ? col.fluor : col.cobalt;
        c.fillStyle = color; c.shadowColor = color; c.shadowBlur = 12;
        c.beginPath(); c.arc(p.x, p.y, p.rej ? 4 : 5, 0, Math.PI * 2); c.fill();
        if (!p.rej && p.x > 1300) { c.fillRect(p.x - 1, p.y - 14, 2, 28); c.fillRect(p.x - 6, p.y - 14, 12, 2); c.fillRect(p.x - 6, p.y + 12, 12, 2); }
        c.shadowBlur = 0;
      }
      c.globalAlpha = 1;
      this.parts = this.parts.filter(p => !p.dead);
      c.font = '500 15px "JetBrains Mono", monospace';
      for (const l of this.labels) {
        if (dt) { l.y += 26 * dt; l.a -= dt * 0.55; }
        c.globalAlpha = Math.max(0, l.a); c.fillStyle = col.alarm; c.fillText(l.text, l.x, l.y);
      }
      c.globalAlpha = 1;
      this.labels = this.labels.filter(l => l.a > 0);
      if (this.flash > 0) {
        c.fillStyle = `rgba(214,255,62,${0.25 * this.flash})`; c.fillRect(1600, 110, 64, 160);
        if (dt) this.flash -= dt * 3;
      }
    },
    enter() {
      cancelAnimationFrame(this.raf);
      if (reduce) { for (let i = 0; i < 40; i++) { this.spawn(); this.parts[i].x = i * 40; this.parts[i].gate = this.gates.filter(g => g.x < i * 40).length; } this.renderFrame(0); return; }
      let last = performance.now(), acc = 0;
      const loop = now => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        acc += dt; while (acc > 0.11) { this.spawn(); acc -= 0.11; }
        this.renderFrame(dt);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    },
    leave() { cancelAnimationFrame(this.raf); }
  };

  /* ============================================================ firmware state machine */
  S.firmware = {
    timer: 0, i: 0, faulted: false,
    order: ['boot', 'self_test', 'align', 'ready', 'capture', 'quality_check', 'record', 'idle'],
    moveTo(name) {
      const el = $(`#firmware .fw-state[data-state="${name}"]`), tok = $('#fw-token');
      if (!el || !tok) return;
      $$('#firmware .fw-state').forEach(s => s.classList.toggle('cur', s === el));
      const host = $('#firmware .fw'); let ox = 0, oy = 0, n = el;
      while (n && n !== host) { ox += n.offsetLeft; oy += n.offsetTop; n = n.offsetParent; }
      const x = ox + el.offsetWidth / 2, y = oy + el.offsetHeight / 2;
      tok.style.transform = `translate(${x}px, ${y}px)`;
      tok.classList.toggle('fault', name === 'fault');
    },
    run() {
      clearInterval(this.timer); this.i = 0; this.faulted = false;
      $$('#fw-pre li').forEach(li => li.classList.add('ok'));
      this.moveTo('boot');
      if (reduce) { this.moveTo('ready'); return; }
      this.timer = setInterval(() => {
        this.i = (this.i + 1) % this.order.length;
        if (this.order[this.i] === 'boot') this.i = 1;
        this.moveTo(this.order[this.i]);
        deck().sfx('step');
      }, 760);
    },
    enter() { this.run(); },
    leave() { clearInterval(this.timer); },
    step(k) {
      if (k >= 1) {
        clearInterval(this.timer);
        const li = $('#fw-pre li[data-k="interlock"]'); if (li) li.classList.remove('ok');
        this.moveTo('ready');
        setTimeout(() => { this.moveTo('fault'); deck().sfx('reject'); }, 500);
      } else if (k === 0 && this.faulted !== null && $('#firmware').classList.contains('is-active')) this.run();
    }
  };

  /* ============================================================ runtime: typed records */
  const REC_A = `{
  "schema_version": "1.0",
  "measurement_id": "demo-m-42-0000",
  "session_id": "demo-session-000",
  "subject_id": "demo-subject-000",
  "device_id": "demo-device-001",
  "eye": "OD",
  "captured_at": "2026-10-04T09:00:00+00:00",
  "synthetic": true,
  "quality_status": "pass",
  "quality_reasons": [],
  "iop_estimate_mmhg": 15.09,
  "calibration_id": "demo-calibration-001",
  "model_id": "demo-no-clinical-model",
  "firmware_version": "demo-0.1.0",
  "raw_sha256": "ee84f056…a5970e901",
  "clock_status": "trusted"
}`;
  const REC_B = `{
  "schema_version": "1.0",
  "measurement_id": "demo-m-42-0005",
  "session_id": "demo-session-001",
  "subject_id": "demo-subject-001",
  "device_id": "demo-device-001",
  "eye": "OS",
  "captured_at": "2026-10-04T09:05:00+00:00",
  "synthetic": true,
  "quality_status": "reject",
  "quality_reasons": ["blink"],
  "iop_estimate_mmhg": null,
  "calibration_id": "demo-calibration-001",
  "model_id": "demo-no-clinical-model",
  "firmware_version": "demo-0.1.0",
  "raw_sha256": "6e57c107…f33cacfe7",
  "clock_status": "trusted"
}`;
  function hl(s) {
    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return s.split('\n').map(line => {
      const m = line.match(/^(\s*)("[^"]*")(:\s*)(.*)$/);
      if (!m) return esc(line);
      const [, ind, key, colon, rest] = m;
      let cls = '';
      if (rest.startsWith('"')) cls = 's';
      else if (/^-?\d/.test(rest)) cls = 'n';
      else if (/^(null|true|false)/.test(rest)) cls = 'b';
      if ((key === '"quality_status"' && rest.includes('reject')) || (key === '"iop_estimate_mmhg"' && rest.startsWith('null')) || (key === '"quality_reasons"' && rest.includes('blink'))) cls += ' bad';
      if (key === '"iop_estimate_mmhg"' && /^\d/.test(rest)) cls += ' ok';
      const val = cls ? `<span class="${cls.trim()}">${esc(rest)}</span>` : esc(rest);
      return `${ind}<span class="k">${esc(key)}</span>${colon}${val}`;
    }).join('\n');
  }
  S.runtime = {
    raf: 0,
    init() { $('#rt-a').innerHTML = hl(REC_A); $('#rt-b').innerHTML = hl(REC_B); },
    enter() {
      cancelAnimationFrame(this.raf);
      if (reduce) return this.init();
      const a = $('#rt-a'), b = $('#rt-b');
      let ia = 0, ib = 0, last = 0;
      a.innerHTML = ''; b.innerHTML = '';
      const t0 = performance.now() + 500;
      const loop = now => {
        if (now < t0) { this.raf = requestAnimationFrame(loop); return; }
        ia = Math.min(REC_A.length, ia + 9);
        if (ia > REC_A.length * 0.35) ib = Math.min(REC_B.length, ib + 9);
        a.innerHTML = hl(REC_A.slice(0, ia)) + (ia < REC_A.length ? '<span class="caret"></span>' : '');
        b.innerHTML = hl(REC_B.slice(0, ib)) + (ib < REC_B.length && ib > 0 ? '<span class="caret"></span>' : '');
        if (now - last > 70) { deck().sfx('type'); last = now; }
        if (ia < REC_A.length || ib < REC_B.length) this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    },
    leave() { cancelAnimationFrame(this.raf); this.init(); }
  };

  /* ============================================================ charts (built once, drawn to scale) */
  function hbars(el, rows, { max, unit = '', dec = 0, ticks = [] }) {
    el.classList.add('hbars');
    el.style.setProperty('--max', max);
    const axis = ticks.length ? `<div class="hb-axis">${ticks.map(t => `<span style="left:${(t / max) * 100}%">${t}${unit}</span>`).join('')}</div>` : '';
    el.innerHTML = rows.map((r, i) => `
      <div class="hb-row ${r.cls || ''}" style="--i:${i}">
        <span class="hb-label">${r.label}</span>
        <span class="hb-track"><span class="hb-bar" style="width:${(r.v / max) * 100}%"></span></span>
        <span class="hb-val">${r.v.toFixed(dec)}${unit}${r.tag ? ` <em>${r.tag}</em>` : ''}</span>
      </div>`).join('') + axis;
  }
  function buildCharts() {
    const reasons = $('#ch-reasons');
    if (reasons) hbars(reasons, [
      { label: 'out_of_domain', v: 161 }, { label: 'signal_quality', v: 158 }, { label: 'estimate_uncertain', v: 135 },
      { label: 'alignment', v: 79 }, { label: 'blink', v: 38 }, { label: 'calibration_expired', v: 28 }, { label: 'clock_untrusted', v: 8 }
    ], { max: 180, ticks: [0, 60, 120, 180] });
    const rmse = $('#ch-rmse');
    if (rmse) hbars(rmse, [
      { label: 'Physics ridge', v: 1.958 }, { label: 'Ridge + residual LightGBM', v: 1.943 },
      { label: 'Ridge + residual 1D-ResNet ensemble', v: 1.930, cls: 'hi', tag: 'selected' }, { label: 'Cross-fitted stack', v: 1.949 }
    ], { max: 2.0, dec: 3, unit: '', ticks: [0, 0.5, 1.0, 1.5, 2.0] });
    buildRange(); buildCct(); buildDonut('#ch-donut1', [47.6, 38.1, 14.3]); buildDonut('#ch-donut2', [48, 36, 16]);
    buildBreakeven(); buildTimeline(); buildRuler();
  }

  function buildRange() {
    const host = $('#ch-range'); if (!host) return;
    const W = 1040, H = 700, L = 110, R = 1020, T = 30, B = 600, lo = -14, hi = 18;
    const y = v => T + (hi - v) / (hi - lo) * (B - T);
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-label': 'Limits of agreement in mmHg: ungated -12.54 to 15.37, gated test -3.64 to 3.60, gated external -3.98 to 4.16' }, host);
    for (let v = -12; v <= 16; v += 4) {
      svg('line', { x1: L, x2: R, y1: y(v), y2: y(v), class: v === 0 ? 'ax0' : 'grid' }, s);
      const t = svg('text', { x: L - 16, y: y(v) + 7, 'text-anchor': 'end', class: 'tick' }, s); t.textContent = (v > 0 ? '+' : '') + v;
    }
    const yl = svg('text', { x: 24, y: (T + B) / 2, class: 'axlabel', transform: `rotate(-90 24 ${(T + B) / 2})`, 'text-anchor': 'middle' }, s);
    yl.textContent = 'Estimate − reference (mmHg)';
    const cols = [
      { x: 290, lo: -12.54, hi: 15.37, bias: 1.42, cls: 'r-ember', name: 'Ungated', sub: 'all detectable · 900', rmse: '7.25', s: 0 },
      { x: 590, lo: -3.64, hi: 3.60, bias: -0.02, cls: 'r-fluor', name: 'Gated · test', sub: '607 of 900 accepted', rmse: '1.84', s: 1 },
      { x: 860, lo: -3.98, hi: 4.16, bias: 0.09, cls: 'r-cobalt', name: 'Gated · external', sub: '46.3% of 1,200', rmse: '2.07', s: 2 }
    ];
    cols.forEach(c => {
      const g = svg('g', { class: `rcol ${c.cls}`, 'data-s': c.s }, s);
      svg('rect', { x: c.x - 60, y: y(c.hi), width: 120, height: y(c.lo) - y(c.hi), rx: 6, class: 'band' }, g);
      svg('line', { x1: c.x - 84, x2: c.x + 84, y1: y(c.hi), y2: y(c.hi), class: 'lim' }, g);
      svg('line', { x1: c.x - 84, x2: c.x + 84, y1: y(c.lo), y2: y(c.lo), class: 'lim' }, g);
      svg('line', { x1: c.x - 70, x2: c.x + 70, y1: y(c.bias), y2: y(c.bias), class: 'bias' }, g);
      const t1 = svg('text', { x: c.x + 92, y: y(c.hi) + 7, class: 'lval' }, g); t1.textContent = (c.hi > 0 ? '+' : '') + c.hi.toFixed(2);
      const t2 = svg('text', { x: c.x + 92, y: y(c.lo) + 7, class: 'lval' }, g); t2.textContent = c.lo.toFixed(2);
      const n1 = svg('text', { x: c.x, y: B + 40, 'text-anchor': 'middle', class: 'cname' }, g); n1.textContent = c.name;
      const n2 = svg('text', { x: c.x, y: B + 66, 'text-anchor': 'middle', class: 'csub' }, g); n2.textContent = c.sub;
      const n3 = svg('text', { x: c.x, y: B + 90, 'text-anchor': 'middle', class: 'csub' }, g); n3.textContent = `RMSE ${c.rmse} mmHg`;
    });
  }

  function buildCct() {
    const host = $('#ch-cct'); if (!host) return;
    const W = 1000, H = 560, X0 = 580, sc = 150; // px per mmHg, axis ±2
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-label': 'Bias by corneal thickness group in mmHg. Test: thin -1.07, mid -0.50, thick +1.26. External: thin -1.86, mid +0.15, thick +1.34' }, host);
    for (let v = -2; v <= 2; v += 1) {
      const x = X0 + v * sc;
      svg('line', { x1: x, x2: x, y1: 40, y2: 500, class: v === 0 ? 'ax0' : 'grid' }, s);
      const t = svg('text', { x, y: 536, 'text-anchor': 'middle', class: 'tick' }, s); t.textContent = (v > 0 ? '+' : '') + v;
    }
    const rows = [
      { g: 'Test', n: 'Thin cornea', v: -1.07, y: 70 }, { g: 'Test', n: 'Mid', v: -0.50, y: 130 }, { g: 'Test', n: 'Thick cornea', v: 1.26, y: 190 },
      { g: 'External', n: 'Thin cornea', v: -1.86, y: 300, note: 'coverage 85.4%' }, { g: 'External', n: 'Mid', v: 0.15, y: 360 }, { g: 'External', n: 'Thick cornea', v: 1.34, y: 420 }
    ];
    [['Held-out test', 40], ['External device lot', 270]].forEach(([t, yy]) => { const e = svg('text', { x: 0, y: yy, class: 'grp' }, s); e.textContent = t; });
    rows.forEach((r, i) => {
      const w = Math.abs(r.v) * sc, x = r.v < 0 ? X0 - w : X0;
      const g = svg('g', { class: 'cct-row ' + (r.v < 0 ? 'neg' : 'pos'), style: `--i:${i}` }, s);
      svg('rect', { x, y: r.y, width: w, height: 38, rx: 4 }, g);
      const lbl = svg('text', { x: 0, y: r.y + 27, class: 'rl' }, g); lbl.textContent = r.n;
      const val = svg('text', { x: r.v < 0 ? x - 12 : x + w + 12, y: r.y + 27, 'text-anchor': r.v < 0 ? 'end' : 'start', class: 'rv' }, g);
      val.textContent = (r.v > 0 ? '+' : '') + r.v.toFixed(2);
      if (r.note) { const nt = svg('text', { x: X0 + 14, y: r.y + 27, class: 'rn' }, g); nt.textContent = r.note; }
    });
    const ax = svg('text', { x: X0, y: 560, 'text-anchor': 'middle', class: 'axlabel' }, s); ax.textContent = 'Bias, mmHg (synthetic)';
  }

  function buildDonut(sel, vals) {
    const host = $(sel); if (!host) return;
    const s = svg('svg', { viewBox: '0 0 240 240', 'aria-hidden': 'true' }, host);
    const r = 92, C = 2 * Math.PI * r; let off = 0;
    svg('circle', { cx: 120, cy: 120, r, class: 'd-track' }, s);
    vals.forEach((v, i) => {
      const len = v / 100 * C;
      svg('circle', { cx: 120, cy: 120, r, class: `d-seg d${i}`, 'stroke-dasharray': `${Math.max(0, len - 4)} ${C}`, 'stroke-dashoffset': -off, transform: 'rotate(-90 120 120)', style: `--i:${i}` }, s);
      off += len;
    });
  }

  function buildBreakeven() {
    const host = $('#ch-breakeven'); if (!host) return;
    const W = 1000, H = 620, L = 110, R = 960, T = 30, B = 540, xMax = 200, yMax = 20;
    const x = u => L + u / xMax * (R - L), y = v => B - v / yMax * (B - T);
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-label': 'Break-even: contribution of 10,000 rupees per unit crosses fixed costs of 12.59 lakh at 126 units' }, host);
    for (let v = 0; v <= 20; v += 5) {
      svg('line', { x1: L, x2: R, y1: y(v), y2: y(v), class: v === 0 ? 'ax0' : 'grid' }, s);
      const t = svg('text', { x: L - 14, y: y(v) + 7, 'text-anchor': 'end', class: 'tick' }, s); t.textContent = `₹${v}L`;
    }
    for (let u = 0; u <= 200; u += 50) { const t = svg('text', { x: x(u), y: B + 34, 'text-anchor': 'middle', class: 'tick' }, s); t.textContent = u; }
    const xl = svg('text', { x: (L + R) / 2, y: B + 74, 'text-anchor': 'middle', class: 'axlabel' }, s); xl.textContent = 'Units sold in a year';
    svg('line', { x1: x(0), x2: x(200), y1: y(12.59), y2: y(12.59), class: 'fixed' }, s);
    const fl = svg('text', { x: x(4), y: y(12.59) - 14, class: 'flabel' }, s); fl.textContent = 'Fixed costs ₹12.59 lakh / year';
    svg('path', { d: `M${x(0)},${y(0)} L${x(200)},${y(20)}`, class: 'contrib', pathLength: 1 }, s);
    const cl = svg('text', { x: x(152), y: y(15.2) - 22, class: 'clabel', 'text-anchor': 'end' }, s); cl.textContent = '₹10,000 contribution per unit';
    svg('polygon', { points: `${x(125.9)},${y(12.59)} ${x(200)},${y(12.59)} ${x(200)},${y(20)}`, class: 'profit' }, s);
    const g = svg('g', { class: 'be' }, s);
    svg('line', { x1: x(125.9), x2: x(125.9), y1: y(12.59), y2: B, class: 'be-drop' }, g);
    svg('circle', { cx: x(125.9), cy: y(12.59), r: 10, class: 'be-dot' }, g);
    const bt = svg('text', { x: x(125.9) + 18, y: y(12.59) + 44, class: 'be-label' }, g); bt.textContent = '126 units';
    const g2 = svg('g', { class: 'f180' }, s);
    svg('line', { x1: x(180), x2: x(180), y1: y(18), y2: B, class: 'be-drop dim' }, g2);
    svg('circle', { cx: x(180), cy: y(18), r: 7, class: 'dot180' }, g2);
    const t180 = svg('text', { x: x(180) - 14, y: y(18) - 18, 'text-anchor': 'end', class: 'flabel' }, g2); t180.textContent = 'Deck year-1 forecast: 180';
  }

  function buildTimeline() {
    const host = $('#tl'); if (!host) return;
    const items = [
      ['2024-08-23', 'SIH 2024 idea', 'Problem 1550: a portable non-contact eye-pressure device for home use', 1],
      ['2024-11-25', 'First ML notebook', 'Keras CNN on fundus images', 3],
      ['2025-02-20', 'Six app prototypes', 'Hugging Face Spaces: FastAPI, Streamlit, Gradio, Node', 0],
      ['2025-05-01', 'ORIGA experiments', 'VGG19, ResNet18, DenseNet169', 2],
      ['2025-07-03', 'Team deck', '"Intra Puff Pressure Analyzer": dual-eye concept, block diagram, Proteus', 1],
      ['2025-08-19', 'Pitch', 'Arduino/ESP32 prototype, ≈ ₹7,000 reported', 3],
      ['2025-09-06', 'Patent draft guide', 'Preparatory; nothing filed on record', 0],
      ['2025-11-04', 'Web app', 'React dashboards for patient, doctor, admin (mock data)', 2],
      ['2026-09-13', 'Device drawings', 'Five concept sheets incl. a patent-style view', 1],
      ['2026-10-04', 'Home monitoring chosen', 'Sources recovered and audited · v0.2.0', 3],
      ['2026-11-23', 'v0.3.0', 'IOP estimation stack, verified on synthetic data', 0]
    ];
    const d0 = Date.parse('2024-08-01'), d1 = Date.parse('2026-12-10'), W = 1600;
    const line = document.createElement('div'); line.className = 'tl-line'; host.appendChild(line);
    ['2025', '2026'].forEach(yr => {
      const x = (Date.parse(`${yr}-01-01`) - d0) / (d1 - d0) * W;
      const m = document.createElement('div'); m.className = 'tl-year'; m.style.left = x + 'px'; m.textContent = yr; host.appendChild(m);
    });
    items.forEach(([date, title, sub, lvl], i) => {
      const x = (Date.parse(date) - d0) / (d1 - d0) * W;
      const el = document.createElement('div');
      el.className = `tl-item l${lvl}${x > W - 260 ? ' right' : ''}`;
      el.style.left = x + 'px'; el.style.setProperty('--i', i);
      const dt = new Date(date + 'T00:00:00Z');
      const label = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      el.innerHTML = `<span class="tl-dot"></span><span class="tl-stem"></span><div class="tl-card"><time>${label}</time><b>${title}</b><span>${sub}</span></div>`;
      host.appendChild(el);
    });
  }

  function buildRuler() {
    const host = $('#ch-ruler'); if (!host) return;
    const W = 1664, H = 250, L = 40, R = 1624, lo = 6, hi = 34;
    const x = v => L + (v - lo) / (hi - lo) * (R - L);
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-label': 'An example reading of 18 mmHg with an interval of plus or minus 3.68 mmHg, the test-set mean width; readings whose half-width exceeds 5 mmHg are withheld' }, host);
    svg('line', { x1: L, x2: R, y1: 170, y2: 170, class: 'r-axis' }, s);
    for (let v = lo; v <= hi; v++) {
      svg('line', { x1: x(v), x2: x(v), y1: 170, y2: v % 5 === 0 ? 192 : 180, class: 'r-tick' }, s);
      if (v % 5 === 0) { const t = svg('text', { x: x(v), y: 224, 'text-anchor': 'middle', class: 'tick' }, s); t.textContent = v; }
    }
    const u = svg('text', { x: R, y: 224, 'text-anchor': 'end', class: 'tick' }, s); u.textContent = 'mmHg';
    const g = svg('g', { class: 'r-gate' }, s);
    svg('rect', { x: x(13), y: 70, width: x(23) - x(13), height: 80, rx: 8, class: 'gate-zone' }, g);
    const gt = svg('text', { x: x(23) + 14, y: 92, class: 'gate-t' }, g); gt.textContent = 'Withhold if half-width > 5 mmHg';
    const iv = svg('g', { class: 'r-int' }, s);
    svg('rect', { x: x(18 - 3.68), y: 98, width: x(18 + 3.68) - x(18 - 3.68), height: 24, rx: 12, class: 'int-bar' }, iv);
    svg('circle', { cx: x(18), cy: 110, r: 13, class: 'int-dot' }, iv);
    const a = svg('text', { x: x(18 - 3.68), y: 150, 'text-anchor': 'middle', class: 'iv' }, iv); a.textContent = '14.3';
    const b = svg('text', { x: x(18 + 3.68), y: 150, 'text-anchor': 'middle', class: 'iv' }, iv); b.textContent = '21.7';
    const c = svg('text', { x: x(18), y: 52, 'text-anchor': 'middle', class: 'iv big' }, iv); c.textContent = '18.0 mmHg';
  }

  S.__charts = { init: buildCharts };
  window.AIRTON_SCENES = S;
  window.AIRTON_SIM = { simulate, extract, rules };
})();
