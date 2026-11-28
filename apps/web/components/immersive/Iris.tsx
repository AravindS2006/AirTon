import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';

/**
 * A living iris rendered with WebGL behind the whole interface. Pages and scroll
 * scenes move it like a camera: x/y are viewport fractions, r is the iris radius as
 * a fraction of the shorter viewport side, i is intensity (0 hides it), p the pupil
 * fraction, w a warm tint and fix the fixation light at the pupil centre.
 */
export interface IrisTarget {
  x: number;
  y: number;
  r: number;
  i: number;
  p?: number;
  w?: number;
  fix?: number;
}
export type IrisSpec = IrisTarget | { d: IrisTarget; m?: IrisTarget };

interface IrisApi {
  setTarget: (spec: IrisSpec, instant?: boolean) => void;
  pulse: (strength?: number) => void;
  /** 0 = night (dark theme), 1 = daylight (light theme). The pupil follows with a slower light reflex. */
  setTheme: (theme: number, instant?: boolean) => void;
}

const noop: IrisApi = { setTarget: () => undefined, pulse: () => undefined, setTheme: () => undefined };
const IrisContext = createContext<IrisApi>(noop);
export const useIris = () => useContext(IrisContext);

const MOBILE = '(max-width: 767px)';
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resolve(spec: IrisSpec): IrisTarget {
  if ('d' in spec) {
    const mobile = window.matchMedia(MOBILE).matches;
    return mobile && spec.m ? spec.m : spec.d;
  }
  return spec;
}

interface Renderer {
  setTarget: (t: IrisTarget, instant: boolean) => void;
  pulse: (s: number) => void;
  setTheme: (t: number, instant: boolean) => void;
  destroy: () => void;
}

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = `precision mediump float;
uniform vec2 uRes; uniform vec2 uC; uniform float uR, uI, uP, uPulse, uT, uRip, uWarm, uFix, uTheme;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1.0,0.0)), f.x), mix(h(i+vec2(0.0,1.0)), h(i+vec2(1.0,1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++){ v += a*n(p); p = p*2.02 + vec2(3.1,1.7); a *= 0.5; } return v; }
void main(){
  vec2 fc = gl_FragCoord.xy; vec2 uv = fc/uRes; float m = min(uRes.x, uRes.y);
  vec2 q = (fc - 0.5*uRes)/m;
  float hz = fbm(q*1.4 + vec2(uT*0.012, -uT*0.009));
  vec3 night = vec3(0.014, 0.024, 0.05);
  night += vec3(0.018, 0.036, 0.085) * smoothstep(1.3, 0.0, length(q - vec2(0.0, 0.15)));
  night += vec3(0.012, 0.026, 0.065) * hz;
  // Daylight: the ground becomes the white of the eye (sclera), cool and faintly clouded.
  vec3 day = vec3(0.945, 0.956, 0.978);
  day -= vec3(0.052, 0.042, 0.012) * smoothstep(0.2, 1.4, length(q - vec2(0.05, 0.1)));
  day -= vec3(0.02, 0.016, 0.0) * hz;
  vec3 col = mix(night, day, uTheme);
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
  vec3 ic = mix(cInner, vec3(0.17, 0.36, 0.82), smoothstep(0.06, 0.44, t + (crypt - 0.5)*0.28));
  ic = mix(ic, vec3(0.07, 0.17, 0.52), smoothstep(0.55, 1.0, t));
  ic *= 0.42 + 0.78*fib; ic *= 0.68 + 0.62*crypt;
  ic += vec3(1.0, 0.62, 0.26) * 0.28 * exp(-pow((t - 0.2)*9.0, 2.0)) * fib;
  ic *= 1.0 - 0.8*smoothstep(0.8, 1.0, t);
  col = mix(col, ic, inIris * outPupil * uI);
  col = mix(col, vec3(0.004, 0.006, 0.012), (1.0 - outPupil) * inIris * uI);
  col += vec3(0.04, 0.09, 0.24) * exp(-max(r - 1.0, 0.0)*5.0) * smoothstep(0.92, 1.04, r) * uI * 0.7 * (1.0 - uTheme);
  float shade = exp(-max(r - 1.0, 0.0)*7.0) * smoothstep(0.96, 1.04, r);
  col *= 1.0 - 0.24*shade*uI*uTheme;
  vec2 hl = d - vec2(-0.36, 0.40);
  col += vec3(0.82, 0.88, 1.0) * exp(-dot(hl, hl)*26.0) * smoothstep(1.1, 0.7, r) * 0.32 * uI;
  col += mix(vec3(0.85, 1.0, 0.45)*0.07, vec3(-0.12, -0.07, 0.02)*0.6, uTheme) * wave * uI;
  float dd = dot(d, d);
  col += vec3(0.84, 1.0, 0.24) * uFix * uI * (exp(-dd*1100.0)*1.1 + exp(-dd*140.0)*0.22);
  float vg = smoothstep(0.45, 1.2, length(uv - 0.5)*1.45);
  col *= 1.0 - vg*mix(0.38, 0.07, uTheme);
  col += (h(fc + fract(uT)*91.7) - 0.5) * mix(0.016, 0.01, uTheme);
  gl_FragColor = vec4(col, 1.0);
}`;

function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const reduce = prefersReducedMotion();
  const dead: Renderer = { setTarget: () => undefined, pulse: () => undefined, setTheme: () => undefined, destroy: () => undefined };
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false }) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) {
    document.documentElement.classList.add('no-gl');
    return dead;
  }
  const g = gl;
  const compile = (type: number, src: string) => {
    const s = g.createShader(type);
    if (!s) throw new Error('shader');
    g.shaderSource(s, src);
    g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) || 'compile');
    return s;
  };
  let prog: WebGLProgram | null = null;
  try {
    prog = g.createProgram();
    if (!prog) throw new Error('program');
    g.attachShader(prog, compile(g.VERTEX_SHADER, VERT));
    g.attachShader(prog, compile(g.FRAGMENT_SHADER, FRAG));
    g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error('link');
  } catch (e) {
    console.warn('Iris background unavailable', e);
    document.documentElement.classList.add('no-gl');
    return dead;
  }
  g.useProgram(prog);
  const buf = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
  const loc = g.getAttribLocation(prog, 'p');
  g.enableVertexAttribArray(loc);
  g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
  const U: Record<string, WebGLUniformLocation | null> = {};
  ['uRes', 'uC', 'uR', 'uI', 'uP', 'uPulse', 'uT', 'uRip', 'uWarm', 'uFix', 'uTheme'].forEach((k) => {
    U[k] = g.getUniformLocation(prog as WebGLProgram, k);
  });

  const cur = { x: 0.74, y: 0.5, r: 0.42, i: 0, p: 0.3, w: 0, fix: 0 };
  const tgt = { ...cur };
  const startTheme = document.documentElement.dataset.theme === 'light' ? 1 : 0;
  let theme = startTheme;
  let themeT = startTheme;
  let reflex = startTheme;
  let reflexT = startTheme;
  let pulse = 0;
  let rip = 0;
  let last = performance.now();
  let raf = 0;
  let visible = !document.hidden;
  const SCALE = 0.62;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.max(2, Math.round(window.innerWidth * dpr * SCALE));
    canvas.height = Math.max(2, Math.round(window.innerHeight * dpr * SCALE));
    g.viewport(0, 0, canvas.width, canvas.height);
    if (reduce) draw(performance.now());
  };

  function draw(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 2.1);
    (Object.keys(cur) as (keyof typeof cur)[]).forEach((key) => {
      cur[key] += (tgt[key] - cur[key]) * k;
    });
    pulse *= Math.exp(-dt * 1.9);
    theme += (themeT - theme) * (reduce ? 1 : 1 - Math.exp(-dt * 3));
    reflex += (reflexT - reflex) * (reduce ? 1 : 1 - Math.exp(-dt * 1.3));
    rip += dt;
    const w = canvas.width;
    const h = canvas.height;
    g.uniform2f(U.uRes, w, h);
    g.uniform2f(U.uC, cur.x * w, h - cur.y * h);
    g.uniform1f(U.uR, cur.r * Math.min(w, h));
    g.uniform1f(U.uI, cur.i);
    g.uniform1f(U.uP, cur.p * (1 - 0.36 * reflex));
    g.uniform1f(U.uTheme, theme);
    g.uniform1f(U.uWarm, cur.w);
    g.uniform1f(U.uFix, cur.fix);
    g.uniform1f(U.uPulse, pulse);
    g.uniform1f(U.uRip, rip);
    g.uniform1f(U.uT, reduce ? 12 : now / 1000);
    g.drawArrays(g.TRIANGLES, 0, 3);
  }
  const loop = (now: number) => {
    if (visible) draw(now);
    raf = requestAnimationFrame(loop);
  };
  const onVis = () => {
    visible = !document.hidden;
    last = performance.now();
  };
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVis);
  resize();
  if (!reduce) raf = requestAnimationFrame(loop);
  else draw(performance.now());

  return {
    setTarget(t, instant) {
      Object.assign(tgt, { p: 0.3, w: 0, fix: 0, ...t });
      if (instant || reduce) {
        Object.assign(cur, tgt);
        if (reduce) draw(performance.now());
      }
    },
    setTheme(t, instant) {
      themeT = t;
      reflexT = t;
      if (instant || reduce) {
        theme = t;
        if (reduce) reflex = t;
        draw(performance.now());
      }
    },
    pulse(s) {
      if (reduce) return;
      pulse = Math.min(1.2, pulse + s);
      rip = 0;
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}

export const IrisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Renderer | null>(null);
  const pending = useRef<{ t: IrisTarget; instant: boolean } | null>(null);
  const pendingTheme = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const r = createRenderer(canvasRef.current);
    renderer.current = r;
    if (pending.current) r.setTarget(pending.current.t, true);
    if (pendingTheme.current !== null) r.setTheme(pendingTheme.current, true);
    return () => {
      r.destroy();
      renderer.current = null;
    };
  }, []);

  const api = useMemo<IrisApi>(
    () => ({
      setTarget(spec, instant = false) {
        const t = resolve(spec);
        if (renderer.current) renderer.current.setTarget(t, instant);
        else pending.current = { t, instant };
      },
      pulse(s = 1) {
        renderer.current?.pulse(s);
      },
      setTheme(t, instant = false) {
        if (renderer.current) renderer.current.setTheme(t, instant);
        else pendingTheme.current = t;
      },
    }),
    [],
  );

  return (
    <IrisContext.Provider value={api}>
      <canvas ref={canvasRef} className="iris-canvas" aria-hidden="true" />
      {children}
    </IrisContext.Provider>
  );
};
