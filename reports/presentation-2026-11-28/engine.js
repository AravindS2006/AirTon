/* AirTon deck engine: stage scaling, slides and steps, eye-themed transitions,
   WebGL iris background, synthesized sound, HUD, notes, overview, autoplay. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage');
  const viewport = $('#viewport');
  const slides = $$('#slides > .slide');
  const fx = $('#fx');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } }
  };
  const scenes = () => window.AIRTON_SCENES || {};
  let idx = 0, step = 0, busy = false, auto = false, autoTimer = 0, startedAt = performance.now();
  let muted = store.get('airton-muted') === '1';

  /* ---------------------------------------------------------------- scale */
  let stageRect = null;
  function fit() {
    const cs = getComputedStyle(viewport);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const s = Math.min((innerWidth - padX) / 1920, innerHeight / 1080);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    stage.style.setProperty('--scale', s);
    stageRect = stage.getBoundingClientRect();
    bg.resize();
    if (overBuilt && !overEl.hidden) scaleOverview();
  }

  /* ---------------------------------------------------------------- audio */
  const audio = (() => {
    let ctx = null, master = null, noise = null;
    function unlock() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try { ctx = new AC(); } catch { return; }
        master = ctx.createGain();
        master.gain.value = 0.2;
        master.connect(ctx.destination);
        const len = ctx.sampleRate;
        noise = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    }
    function env(g, t, a, peak, dec) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    }
    function noiseVoice(t, { type = 'bandpass', f0 = 1200, f1 = 400, q = 0.8, dur = 0.3, peak = 0.6, a = 0.006 }) {
      const src = ctx.createBufferSource(); src.buffer = noise;
      const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain(); env(g, t, a, peak, dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t, Math.random() * 0.5); src.stop(t + a + dur + 0.05);
    }
    function tone(t, { type = 'sine', f0 = 880, f1 = f0, dur = 0.08, peak = 0.3, a = 0.004 }) {
      const o = ctx.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain(); env(g, t, a, peak, dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + a + dur + 0.05);
    }
    const kit = {
      puff(t) { noiseVoice(t, { f0: 2600, f1: 380, q: 0.7, dur: 0.32, peak: 0.9 }); tone(t, { f0: 110, f1: 48, dur: 0.18, peak: 0.35 }); },
      blink(t) { noiseVoice(t, { type: 'lowpass', f0: 900, f1: 300, q: 0.4, dur: 0.16, peak: 0.35, a: 0.02 }); noiseVoice(t + 0.36, { type: 'lowpass', f0: 500, f1: 1100, q: 0.4, dur: 0.2, peak: 0.25, a: 0.03 }); },
      iris(t) { tone(t, { f0: 196, f1: 294, dur: 0.6, peak: 0.12, a: 0.08 }); noiseVoice(t, { f0: 500, f1: 2400, q: 2, dur: 0.6, peak: 0.12, a: 0.1 }); },
      sweep(t) { noiseVoice(t, { f0: 400, f1: 4200, q: 3, dur: 0.8, peak: 0.18, a: 0.15 }); },
      focus(t) { tone(t, { f0: 740, f1: 990, dur: 0.12, peak: 0.08 }); tone(t + 0.09, { f0: 1480, dur: 0.05, peak: 0.06 }); },
      shutter(t) { for (let i = 0; i < 5; i++) tone(t + i * 0.055, { type: 'triangle', f0: 1900 - i * 120, dur: 0.025, peak: 0.12 }); },
      step(t) { tone(t, { f0: 1320, f1: 1180, dur: 0.035, peak: 0.08 }); },
      accept(t) { tone(t, { f0: 660, dur: 0.11, peak: 0.14 }); tone(t + 0.1, { f0: 990, dur: 0.16, peak: 0.12 }); },
      reject(t) { tone(t, { type: 'square', f0: 150, f1: 120, dur: 0.18, peak: 0.07 }); },
      type(t) { tone(t, { type: 'square', f0: 2400 + Math.random() * 600, dur: 0.012, peak: 0.025 }); }
    };
    function play(name, delay = 0) {
      if (muted || !ctx || ctx.state !== 'running' || !kit[name]) return;
      try { kit[name](ctx.currentTime + delay); } catch { /* audio graph unavailable */ }
    }
    return { unlock, play };
  })();
  const sfx = (n, d) => audio.play(n, d);

  /* ---------------------------------------------------------------- background iris (WebGL) */
  const bg = (() => {
    const cv = $('#bg');
    let gl = null;
    try { gl = cv.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch { gl = null; }
    const api = { resize() {}, target() {}, pulse() {}, ok: false };
    if (!gl) { document.documentElement.classList.add('no-gl'); return api; }
    const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
    const fs = `precision mediump float;
uniform vec2 uRes; uniform vec2 uC; uniform float uR, uI, uP, uPulse, uT, uRip, uWarm;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1.0,0.0)), f.x), mix(h(i+vec2(0.0,1.0)), h(i+vec2(1.0,1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++){ v += a*n(p); p = p*2.02 + vec2(3.1,1.7); a *= 0.5; } return v; }
void main(){
  vec2 fc = gl_FragCoord.xy; vec2 uv = fc/uRes; float m = min(uRes.x, uRes.y);
  vec2 q = (fc - 0.5*uRes)/m;
  vec3 col = vec3(0.014, 0.024, 0.05);
  col += vec3(0.018, 0.036, 0.085) * smoothstep(1.3, 0.0, length(q - vec2(0.0, 0.15)));
  float haze = fbm(q*1.4 + vec2(uT*0.012, -uT*0.009));
  col += vec3(0.012, 0.026, 0.065) * haze;
  vec2 d = (fc - uC)/uR; float r = length(d);
  float wave = uPulse * exp(-abs(r - uRip*1.35)*3.5);
  r += 0.05 * wave * sin(r*22.0 - uRip*16.0);
  float a = atan(d.y, d.x); vec2 ad = vec2(cos(a), sin(a));
  float pr = uP * (1.0 - 0.33*uPulse);
  float inIris = smoothstep(1.015, 0.975, r);
  float outPupil = smoothstep(pr - 0.012, pr + 0.022, r);
  float nA = fbm(ad*2.6 + vec2(r*1.9, uT*0.018));
  float fib = 0.55 + 0.45*sin(a*72.0 + nA*9.0);
  fib *= 0.62 + 0.38*sin(a*29.0 - nA*6.0 + r*5.0);
  float crypt = fbm(ad*5.0 + vec2(r*6.5, uT*0.01));
  float t = clamp((r - pr)/(1.0 - pr), 0.0, 1.0);
  vec3 cInner = mix(vec3(0.96, 0.50, 0.15), vec3(1.0, 0.62, 0.22), uWarm);
  vec3 cMid = vec3(0.17, 0.36, 0.82); vec3 cOuter = vec3(0.07, 0.17, 0.52);
  vec3 ic = mix(cInner, cMid, smoothstep(0.06, 0.44, t + (crypt - 0.5)*0.28));
  ic = mix(ic, cOuter, smoothstep(0.55, 1.0, t));
  ic *= 0.42 + 0.78*fib; ic *= 0.68 + 0.62*crypt;
  ic += vec3(1.0, 0.62, 0.26) * 0.28 * exp(-pow((t - 0.2)*9.0, 2.0)) * fib;
  ic *= 1.0 - 0.8*smoothstep(0.8, 1.0, t);
  float mask = inIris * outPupil;
  col = mix(col, ic, mask * uI);
  float pupil = (1.0 - outPupil) * inIris;
  col = mix(col, vec3(0.004, 0.006, 0.012), pupil * uI);
  col += vec3(0.04, 0.09, 0.24) * exp(-max(r - 1.0, 0.0)*5.0) * smoothstep(0.92, 1.04, r) * uI * 0.7;
  vec2 hl = d - vec2(-0.36, 0.40);
  col += vec3(0.82, 0.88, 1.0) * exp(-dot(hl, hl)*26.0) * smoothstep(1.1, 0.7, r) * 0.32 * uI;
  vec2 hl2 = d - vec2(0.18, -0.30);
  col += vec3(0.6, 0.7, 1.0) * exp(-dot(hl2, hl2)*90.0) * 0.12 * uI;
  col += vec3(0.85, 1.0, 0.45) * wave * 0.07 * uI;
  col *= 1.0 - 0.38*smoothstep(0.45, 1.2, length(uv - 0.5)*1.45);
  col += (h(fc + fract(uT)*91.7) - 0.5) * 0.016;
  gl_FragColor = vec4(col, 1.0);
}`;
    function sh(type, src) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) { console.warn('Background shader unavailable', e); document.documentElement.classList.add('no-gl'); return api; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uRes', 'uC', 'uR', 'uI', 'uP', 'uPulse', 'uT', 'uRip', 'uWarm'].forEach(k => { U[k] = gl.getUniformLocation(prog, k); });
    const cur = { x: 0.72, y: 0.5, r: 0.42, i: 1, p: 0.3, w: 0 }, tgt = { ...cur };
    let pulse = 0, rip = 0, scale = 0.62, last = performance.now(), visible = true;
    api.ok = true;
    api.resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.25);
      cv.width = Math.max(2, Math.round(innerWidth * dpr * scale));
      cv.height = Math.max(2, Math.round(innerHeight * dpr * scale));
      gl.viewport(0, 0, cv.width, cv.height);
      if (reduce) draw(performance.now());
    };
    api.target = (el, instant) => {
      const v = (el.dataset.bg || '1.08,0.5,0.62,0.32,0.3').split(',').map(Number);
      Object.assign(tgt, { x: v[0], y: v[1], r: v[2], i: v[3], p: v[4] ?? 0.3, w: v[5] ?? 0 });
      if (instant || reduce) Object.assign(cur, tgt);
      if (reduce) draw(performance.now());
    };
    api.pulse = (s = 1) => { if (reduce) return; pulse = Math.min(1.2, pulse + s); rip = 0; };
    function draw(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const k = 1 - Math.exp(-dt * 2.1);
      for (const key in cur) cur[key] += (tgt[key] - cur[key]) * k;
      pulse *= Math.exp(-dt * 1.9); rip += dt;
      const R = stageRect || { left: 0, top: 0, width: innerWidth, height: innerHeight };
      const sx = cv.width / innerWidth, sy = cv.height / innerHeight;
      const cx = (R.left + cur.x * R.width) * sx;
      const cy = cv.height - (R.top + cur.y * R.height) * sy;
      gl.uniform2f(U.uRes, cv.width, cv.height);
      gl.uniform2f(U.uC, cx, cy);
      gl.uniform1f(U.uR, cur.r * R.height * sy);
      gl.uniform1f(U.uI, cur.i); gl.uniform1f(U.uP, cur.p); gl.uniform1f(U.uWarm, cur.w);
      gl.uniform1f(U.uPulse, pulse); gl.uniform1f(U.uRip, rip);
      gl.uniform1f(U.uT, reduce ? 12.0 : now / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) { if (visible) draw(now); requestAnimationFrame(loop); }
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });
    if (!reduce) requestAnimationFrame(loop);
    return api;
  })();

  /* ---------------------------------------------------------------- steps */
  const stepsOf = el => +(el.dataset.steps || 0);
  function applyStep(el, k) {
    el.dataset.step = k;
    $$('[data-s]', el).forEach(n => n.classList.toggle('on', +n.dataset.s <= k));
    const sc = scenes()[el.id];
    if (sc && sc.step) try { sc.step(k, el); } catch (e) { console.error(e); }
  }

  /* ---------------------------------------------------------------- transitions */
  const EASE = 'cubic-bezier(.7,0,.2,1)';
  const W = 1920, H = 1080;
  function origin(el, fallback) {
    const o = (el.dataset.origin || fallback).split(' ').map(parseFloat);
    return { x: o[0], y: o[1] };
  }
  function ring(o, color, dur, maxR) {
    const r = document.createElement('div');
    r.className = 'fx-ring';
    r.style.left = (o.x / 100 * W) + 'px'; r.style.top = (o.y / 100 * H) + 'px';
    r.style.setProperty('--c', color);
    fx.appendChild(r);
    const a = r.animate([{ transform: 'translate(-50%,-50%) scale(0)', opacity: 1 }, { transform: `translate(-50%,-50%) scale(${maxR})`, opacity: 0 }], { duration: dur, easing: 'cubic-bezier(.2,.7,.2,1)' });
    a.finished.then(() => r.remove(), () => r.remove());
  }
  const finished = a => a.finished.catch(() => {});
  const TR = {
    none(from, to, dir, swap) { swap(); return Promise.resolve(); },
    fade(from, to, dir, swap) {
      from.classList.add('is-leaving'); swap();
      return finished(to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' }));
    },
    focus(from, to, dir, swap) {
      sfx('focus');
      from.classList.add('is-leaving'); swap();
      from.animate([{ filter: 'blur(0px)', opacity: 1, transform: 'scale(1)' }, { filter: 'blur(16px)', opacity: 0, transform: 'scale(.975)' }], { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      return finished(to.animate([{ filter: 'blur(24px)', opacity: 0, transform: 'scale(1.045)' }, { filter: 'blur(0px)', opacity: 1, transform: 'scale(1)' }], { duration: 950, easing: 'cubic-bezier(.2,.75,.1,1)' }));
    },
    iris(from, to, dir, swap) {
      sfx('iris');
      const o = origin(to, '50 50');
      from.classList.add('is-leaving'); swap();
      ring(o, 'var(--fluor)', 1100, 26);
      from.animate([{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(.93)', filter: 'brightness(.35)' }], { duration: 1000, easing: EASE, fill: 'forwards' });
      return finished(to.animate([{ clipPath: `circle(0% at ${o.x}% ${o.y}%)` }, { clipPath: `circle(150% at ${o.x}% ${o.y}%)` }], { duration: 1100, easing: EASE }));
    },
    puff(from, to, dir, swap) {
      sfx('puff'); bg.pulse(1);
      const o = origin(to, '0 52');
      from.classList.add('is-leaving'); swap();
      ring(o, 'var(--ember)', 900, 34); setTimeout(() => ring(o, 'var(--paper)', 800, 30), 90);
      from.animate([{ transform: 'translateX(0) skewX(0)', filter: 'blur(0)' }, { transform: 'translateX(46px) skewX(-2deg)', filter: 'blur(6px)', opacity: 0.4 }], { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
      return finished(to.animate([{ clipPath: `circle(0% at ${o.x}% ${o.y}%)`, transform: 'translateX(-24px)' }, { clipPath: `circle(160% at ${o.x}% ${o.y}%)`, transform: 'translateX(0)' }], { duration: 900, easing: 'cubic-bezier(.3,0,.1,1)' }));
    },
    slit(from, to, dir, swap) {
      sfx('sweep');
      from.classList.add('is-leaving'); swap();
      const beam = document.createElement('div'); beam.className = 'fx-slit'; fx.appendChild(beam);
      const a0 = dir > 0 ? -60 : W + 60, a1 = dir > 0 ? W + 60 : -60;
      const ba = beam.animate([{ transform: `translateX(${a0}px)` }, { transform: `translateX(${a1}px)` }], { duration: 1000, easing: 'cubic-bezier(.65,0,.35,1)' });
      ba.finished.then(() => beam.remove(), () => beam.remove());
      from.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.3)' }], { duration: 1000, fill: 'forwards' });
      const c0 = dir > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
      return finished(to.animate([{ clipPath: c0 }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1000, easing: 'cubic-bezier(.65,0,.35,1)' }));
    },
    shutter(from, to, dir, swap) {
      sfx('shutter');
      from.classList.add('is-leaving'); swap();
      const n = 12, bh = 100 / n;
      const poly = f => {
        const pts = [];
        for (let i = 0; i < n; i++) {
          const y0 = i * bh, y1 = y0 + bh * f;
          pts.push(`0% ${y0}%`, `100% ${y0}%`, `100% ${y1}%`, `0% ${y1}%`);
        }
        return `polygon(${pts.join(',')})`;
      };
      from.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.4)' }], { duration: 800, fill: 'forwards' });
      return finished(to.animate([{ clipPath: poly(0) }, { clipPath: poly(1.02) }], { duration: 820, easing: 'cubic-bezier(.7,0,.25,1)' }));
    },
    async blink(from, to, dir, swap) {
      sfx('blink');
      const top = $('#lid-top'), bot = $('#lid-bot');
      const close = [{ transform: 'translateY(-101%)' }, { transform: 'translateY(0)' }];
      const closeB = [{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }];
      const o1 = { duration: 300, easing: 'cubic-bezier(.55,0,.9,.4)', fill: 'forwards' };
      await Promise.all([finished(top.animate(close, o1)), finished(bot.animate(closeB, o1))]);
      swap(); bg.pulse(0.55);
      await new Promise(r => setTimeout(r, 90));
      const o2 = { duration: 520, easing: 'cubic-bezier(.15,.7,.2,1)', fill: 'forwards' };
      await Promise.all([finished(top.animate([...close].reverse(), o2)), finished(bot.animate([...closeB].reverse(), o2))]);
    }
  };

  /* ---------------------------------------------------------------- navigation */
  function activate(el, k, instant) {
    el.classList.add('is-active');
    applyStep(el, k);
    const sc = scenes()[el.id];
    if (sc && sc.enter) try { sc.enter(el); } catch (e) { console.error(e); }
    bg.target(el, instant);
    countUp(el);
  }
  function deactivate(el) {
    el.classList.remove('is-active', 'is-leaving');
    el.getAnimations().forEach(a => a.cancel());
    const sc = scenes()[el.id];
    if (sc && sc.leave) try { sc.leave(el); } catch (e) { console.error(e); }
  }
  async function go(n, k = 0, dir = 1, instant = false) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (busy) return;
    const from = slides[idx], to = slides[n];
    if (n === idx && !instant) { step = k; applyStep(to, k); hud(); return; }
    busy = true;
    let type = dir > 0 ? (to.dataset.tr || 'focus') : (from.dataset.tr || 'focus');
    if (dir < 0 && (type === 'blink' || type === 'puff')) type = 'focus';
    if (reduce) type = 'fade';
    if (instant) type = 'none';
    const prevIdx = idx;
    idx = n; step = k;
    const swap = () => {
      if (from !== to && !from.classList.contains('is-leaving')) deactivate(from);
      activate(to, k, instant);
      hud();
    };
    try { await TR[type](from, to, dir, swap); } catch (e) { console.error(e); swap(); }
    if (from !== to && (from.classList.contains('is-leaving') || from.classList.contains('is-active'))) deactivate(from);
    to.getAnimations().forEach(a => { if (a.effect && a.effect.target === to) a.cancel(); });
    fx.replaceChildren();
    busy = false;
    setHash(to.id);
    if (prevIdx !== n) scheduleAuto();
  }
  function next() {
    if (busy) return;
    const el = slides[idx];
    if (step < stepsOf(el)) { step++; applyStep(el, step); sfx('step'); hud(); scheduleAuto(); return; }
    if (idx < slides.length - 1) go(idx + 1, 0, 1);
    else toast('End of presentation');
  }
  function prev() {
    if (busy) return;
    const el = slides[idx];
    if (step > 0) { step--; applyStep(el, step); hud(); return; }
    if (idx > 0) go(idx - 1, stepsOf(slides[idx - 1]), -1);
  }
  function jump(n) { if (n !== idx) go(n, 0, n > idx ? 1 : -1); }
  function setHash(id) {
    try { history.replaceState(null, '', '#' + id); } catch { try { location.hash = id; } catch { /* hash unavailable */ } }
  }
  addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    const n = slides.findIndex(s => s.id === id);
    if (n >= 0 && n !== idx) jump(n);
  });

  /* ---------------------------------------------------------------- count-up numbers */
  function countUp(el) {
    if (reduce) return;
    $$('[data-count]', el).forEach(node => {
      const target = parseFloat(node.dataset.count);
      const dec = +(node.dataset.dec || 0);
      const pre = node.dataset.pre || '', suf = node.dataset.suf || '';
      const delay = +(node.dataset.delay || 250);
      const t0 = performance.now() + delay, dur = 1300;
      const fmt = v => pre + v.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      node.textContent = fmt(0);
      const tick = now => {
        if (!el.classList.contains('is-active')) { node.textContent = fmt(target); return; }
        const p = Math.min(1, Math.max(0, (now - t0) / dur));
        const e = 1 - Math.pow(1 - p, 4);
        node.textContent = fmt(target * e);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------------------------------------------------------------- HUD */
  const LEVELS = ['supplied', 'proposed', 'synthetic', 'bench', 'clinical', 'released'];
  const hudChapter = $('#hud-chapter'), hudCount = $('#hud-count'), hudBar = $('#hud-bar'), ladder = $$('#ladder li');
  function hud() {
    const el = slides[idx];
    hudChapter.textContent = el.dataset.chapter || '';
    hudCount.textContent = `${String(idx + 1).padStart(2, '0')} / ${slides.length}`;
    const steps = stepsOf(el);
    const frac = (idx + (steps ? step / (steps + 1) : 0)) / (slides.length - 1);
    hudBar.style.transform = `scaleX(${Math.min(1, frac)})`;
    const ev = (el.dataset.ev || '').split(/\s+/).filter(Boolean);
    $('#ladder').classList.toggle('is-empty', ev.length === 0);
    ladder.forEach((li, i) => li.classList.toggle('lit', ev.includes(LEVELS[i])));
    document.body.classList.toggle('hud-quiet', el.dataset.hud === 'quiet');
    renderNotes();
  }

  /* ---------------------------------------------------------------- notes, overview, help, black */
  const notesEl = $('#notes'), overEl = $('#overview'), helpEl = $('#help'), blackEl = $('#black'), toastEl = $('#toast');
  function renderNotes() {
    if (notesEl.hidden) return;
    const el = slides[idx];
    const note = $('aside.notes', el);
    $('#notes-title').textContent = `${idx + 1}. ${el.dataset.title || el.id}`;
    $('#notes-text').textContent = note ? note.textContent.trim().replace(/\s+\n/g, '\n') : 'No notes for this slide.';
    const steps = stepsOf(el);
    const mins = Math.floor((performance.now() - startedAt) / 60000);
    const secs = Math.floor((performance.now() - startedAt) / 1000) % 60;
    $('#notes-meta').textContent = `Slide ${idx + 1} of ${slides.length}${steps ? ` · step ${step + 1} of ${steps + 1}` : ''} · ${mins}:${String(secs).padStart(2, '0')} elapsed`;
  }
  function toggleNotes(force) {
    notesEl.hidden = force === undefined ? !notesEl.hidden : !force;
    renderNotes();
  }
  setInterval(() => { if (!notesEl.hidden) renderNotes(); }, 1000);
  let overBuilt = false;
  function buildOverview() {
    const grid = $('#overview-grid');
    slides.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ov-item';
      b.setAttribute('aria-label', `Go to slide ${i + 1}: ${s.dataset.title || s.id}`);
      const frame = document.createElement('div'); frame.className = 'ov-frame';
      const clone = s.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.add('thumb'); clone.classList.remove('is-active', 'is-leaving');
      clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      clone.querySelectorAll('aside.notes, canvas').forEach(n => n.remove());
      clone.querySelectorAll('input, button, select').forEach(n => { n.tabIndex = -1; n.disabled = true; });
      frame.appendChild(clone);
      const cap = document.createElement('span');
      cap.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b> ${s.dataset.title || s.id}`;
      b.append(frame, cap);
      b.addEventListener('click', () => { toggleOverview(false); jump(i); });
      grid.appendChild(b);
    });
    overBuilt = true;
  }
  function toggleOverview(force) {
    const open = force === undefined ? overEl.hidden : force;
    if (open && !overBuilt) buildOverview();
    overEl.hidden = !open;
    if (open) {
      const items = $$('.ov-item', overEl);
      scaleOverview();
      items.forEach((it, i) => it.setAttribute('aria-current', i === idx ? 'true' : 'false'));
      const cur = items[idx]; if (cur) { cur.focus({ preventScroll: true }); cur.scrollIntoView({ block: 'center' }); }
    } else stage.focus({ preventScroll: true });
  }
  function scaleOverview() {
    $$('.ov-frame', overEl).forEach(f => f.style.setProperty('--ov', (f.clientWidth || 260) / 1920));
  }
  function toggleHelp(force) { helpEl.hidden = force === undefined ? !helpEl.hidden : !force; }
  function toggleBlack() { blackEl.hidden = !blackEl.hidden; }
  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.classList.remove('show'); }, 1600);
  }
  function setMuted(m) {
    muted = m; store.set('airton-muted', m ? '1' : '0');
    $('#btn-sound').setAttribute('aria-pressed', String(!m));
    $('#btn-sound').classList.toggle('off', m);
    toast(m ? 'Sound off' : 'Sound on');
  }
  function toggleFull() {
    try {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else document.documentElement.requestFullscreen().catch(() => toast('Full screen is not available here'));
    } catch { toast('Full screen is not available here'); }
  }
  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (!auto) return;
    const el = slides[idx];
    const steps = stepsOf(el);
    const dur = step < steps ? 3600 : (+(el.dataset.dur || 8)) * 1000;
    autoTimer = setTimeout(() => {
      if (!auto) return;
      if (idx === slides.length - 1 && step >= steps) { auto = false; toast('Autoplay finished'); return; }
      next();
    }, dur);
  }
  function setAuto(a) { auto = a; toast(a ? 'Playing by itself. Press A to stop.' : 'Manual control'); scheduleAuto(); $('#btn-auto').setAttribute('aria-pressed', String(a)); }

  /* ---------------------------------------------------------------- input */
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    audio.unlock();
    const k = e.key;
    const ae = document.activeElement;
    const inCtl = ae && ae !== stage && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(ae.tagName);
    if (!overEl.hidden) {
      if (k === 'Escape' || k === 'o' || k === 'O') { e.preventDefault(); toggleOverview(false); }
      return;
    }
    if (inCtl) {
      if (k === 'Escape') { ae.blur(); stage.focus({ preventScroll: true }); }
      else if (k === 'PageDown') { e.preventDefault(); next(); }
      else if (k === 'PageUp') { e.preventDefault(); prev(); }
      return;
    }
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(k)) { e.preventDefault(); if (!e.repeat) { if (auto) setAuto(false); next(); } }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); if (!e.repeat) prev(); }
    else if (k === 'Home') go(0, 0, -1);
    else if (k === 'End') go(slides.length - 1, 0, 1);
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 'n' || k === 'N') toggleNotes();
    else if (k === 'o' || k === 'O' || k === 'Escape' && !helpEl.hidden) { if (k === 'Escape') toggleHelp(false); else toggleOverview(true); }
    else if (k === 'm' || k === 'M') setMuted(!muted);
    else if (k === 'a' || k === 'A') setAuto(!auto);
    else if (k === '?' || k === 'h' || k === 'H') toggleHelp();
    else if (k === '.' || k === 'b' || k === 'B') toggleBlack();
  });
  let px = 0, py = 0, pdown = false;
  stage.addEventListener('pointerdown', e => { audio.unlock(); px = e.clientX; py = e.clientY; pdown = true; });
  stage.addEventListener('pointerup', e => {
    if (!pdown) return; pdown = false;
    if (e.button && e.button !== 0) return;
    if (e.target.closest('input, button, select, label, a, [data-interactive]')) return;
    const ae = document.activeElement;
    if (ae && ae !== stage && stage.contains(ae)) ae.blur();
    stage.focus({ preventScroll: true });
    const dx = e.clientX - px, dy = e.clientY - py;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { if (auto) setAuto(false); dx < 0 ? next() : prev(); return; }
    if (Math.hypot(dx, dy) > 12) return;
    const r = stage.getBoundingClientRect();
    if (auto) setAuto(false);
    (e.clientX - r.left) / r.width < 0.1 ? prev() : next();
  });
  blackEl.addEventListener('click', toggleBlack);
  $('#btn-prev').addEventListener('click', () => { audio.unlock(); prev(); });
  $('#btn-next').addEventListener('click', () => { audio.unlock(); next(); });
  $('#btn-over').addEventListener('click', () => toggleOverview(true));
  $('#btn-notes').addEventListener('click', () => toggleNotes());
  $('#btn-sound').addEventListener('click', () => { audio.unlock(); setMuted(!muted); });
  $('#btn-auto').addEventListener('click', () => { audio.unlock(); setAuto(!auto); });
  $('#btn-full').addEventListener('click', toggleFull);
  $('#btn-help').addEventListener('click', () => toggleHelp());
  $('#overview-close').addEventListener('click', () => toggleOverview(false));
  $('#help-close').addEventListener('click', () => toggleHelp(false));
  $('#notes-close').addEventListener('click', () => toggleNotes(false));
  let idleT = 0;
  const wake = () => { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('idle'), 2600); };
  addEventListener('pointermove', wake); wake();
  addEventListener('resize', fit);

  /* ---------------------------------------------------------------- boot */
  window.AIRTON = { bg, sfx, next, prev, go, jump, get muted() { return muted; }, reduce };
  $('#btn-sound').classList.toggle('off', muted);
  $('#btn-sound').setAttribute('aria-pressed', String(!muted));
  fit();
  const s = scenes();
  Object.values(s).forEach(sc => { if (sc.init) try { sc.init(); } catch (e) { console.error(e); } });
  const start = Math.max(0, slides.findIndex(sl => '#' + sl.id === location.hash));
  idx = start;
  const reveal = () => {
    document.body.classList.add('ready');
    activate(slides[idx], 0, true);
    hud();
    stage.focus({ preventScroll: true });
  };
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 1800))]).then(() => requestAnimationFrame(reveal));
})();
