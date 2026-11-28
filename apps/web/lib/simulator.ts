/**
 * Browser port of the repository's synthetic applanation simulator
 * (src/airton/ml/acquisition.py), a simplified feature extractor (iop-features-1)
 * and the deterministic acquisition rules (src/airton/ml/quality.py).
 *
 * ILLUSTRATIVE ONLY. Every parameter is a development assumption, not an AirTon
 * measurement, calibration or clinical value. The learned gates and estimators are
 * not part of this port, so the "midpoint" shown in the interface is a physics
 * feature, not a pressure estimate.
 */

export const N = 320; // samples per acquisition
export const DT = 0.1; // ms per sample (10 kHz)
export const WINDOW_MS = N * DT;

export type Reason =
  | 'alignment'
  | 'blink'
  | 'signal_missing'
  | 'calibration_expired'
  | 'clock_untrusted'
  | 'signal_quality'
  | 'out_of_domain'
  | 'estimate_uncertain';

export const REASON_TEXT: Record<Reason, string> = {
  alignment: 'Device not aligned with the eye',
  blink: 'Blink during the puff',
  signal_missing: 'No applanation event found',
  calibration_expired: 'Calibration expired',
  clock_untrusted: 'Device clock not trusted',
  signal_quality: 'Optical signal too weak or saturated',
  out_of_domain: 'Signal unlike the evaluated domain',
  estimate_uncertain: 'Uncertainty interval too wide',
};

export interface SimParams {
  iop: number;
  cct?: number;
  lat?: number;
  ax?: number;
  gain?: number;
  flicker?: number;
  blink?: boolean;
  tau?: number;
  zs?: number;
  noise?: number;
}

export interface SimResult {
  t: number[];
  pulse: number[];
  pressure: number[];
  y: number[];
  optical: number[];
  ref: number[];
  T: number;
  Rc: number;
  amp: number;
}

export interface Features {
  events: boolean;
  stimulus: boolean;
  snr: number;
  p1: number;
  p2: number;
  t1: number;
  t2: number;
  saturation: number;
  broad: number;
  lat: number;
  ax: number;
}

export const LIMITS = {
  maxLateralMm: 1,
  maxAxialMm: 1.5,
  maxBroadFraction: 0.3,
  maxSaturationFraction: 0.004,
  minSnr: 20,
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Small seeded generator (mulberry32) with a Gaussian helper. */
export function rng(seed: number) {
  let a = seed >>> 0;
  let spare: number | null = null;
  const u = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const g = () => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let x = 0;
    let y = 0;
    let r = 0;
    do {
      x = u() * 2 - 1;
      y = u() * 2 - 1;
      r = x * x + y * y;
    } while (!r || r >= 1);
    const m = Math.sqrt((-2 * Math.log(r)) / r);
    spare = y * m;
    return x * m;
  };
  return { u, g };
}

export function simulate(o: SimParams, seed = 7): SimResult {
  const { u, g } = rng(seed);
  const amp = 72 * (1 + 0.015 * g());
  const sig = 4.5;
  const t0 = 16;
  const lat = o.lat ?? 0;
  const ax = o.ax ?? 0;
  const eff = clamp(1 - 0.032 * lat * lat - 0.025 * Math.abs(ax), 0.45, 1);
  const tau = o.tau ?? 0.55;
  const a = 1 - Math.exp(-DT / tau);
  const Rc = 0.04 * ((o.cct ?? 545) - 545) + 1.2 * (o.zs ?? 0);
  const T = o.iop + Rc;
  const w = 3.5 * (1 + 0.35 * lat);
  const alignAmp = Math.exp(-((lat / 2) ** 2)) * Math.exp(-((ax / 3) ** 2));
  const gain = 0.7 * (o.gain ?? 1) * (1 + 0.04 * g());
  const phase = u() * 2 * Math.PI;
  const ambient = 0.02 + 0.06 * u();
  const flick = o.flicker ?? 0.004;
  const bStart = 6 + 12 * u();
  const lid = 0.55 + 0.35 * u();
  const noise = o.noise ?? 1;
  const out: SimResult = { t: [], pulse: [], pressure: [], y: [], optical: [], ref: [], T, Rc, amp };
  let yy = 0;
  for (let i = 0; i < N; i++) {
    const ti = i * DT;
    const p = amp * Math.exp(-0.5 * ((ti - t0) / sig) ** 2);
    const x = eff * p;
    yy = i === 0 ? x : a * x + (1 - a) * yy;
    let refl = alignAmp * Math.exp(-(((yy - T) / w) ** 2)) + 0.03;
    if (o.blink) {
      const occ = 1 / (1 + Math.exp(-(ti - bStart) / 0.6));
      refl = refl * (1 - occ) + lid * occ;
    }
    let ov = gain * refl + ambient + flick * Math.sin(2 * Math.PI * 0.1 * ti + phase) + 0.01 * g() * noise;
    ov = Math.round(clamp(ov, 0, 1) * 4095) / 4095;
    const pv = Math.round((p + 0.22 * g() * noise) / 0.05) * 0.05;
    out.t.push(ti);
    out.pulse.push(p);
    out.pressure.push(pv);
    out.y.push(yy);
    out.optical.push(ov);
    out.ref.push(refl);
  }
  return out;
}

/* ------------------------------------------------------------------ features */
const DESIGN: number[][] = (() => {
  const rows: number[][] = [];
  const tm = ((N - 1) * DT) / 2000;
  for (let i = 0; i < N; i++) {
    const ts = (i * DT) / 1000;
    rows.push([
      1,
      ts - tm,
      Math.sin(2 * Math.PI * 100 * ts),
      Math.cos(2 * Math.PI * 100 * ts),
      Math.sin(2 * Math.PI * 200 * ts),
      Math.cos(2 * Math.PI * 200 * ts),
    ]);
  }
  return rows;
})();

function solve(M: number[][], b: number[]): number[] {
  const n = b.length;
  const A = M.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c] / d;
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((r, i) => r[n] / (r[i] || 1e-12));
}

const median = (arr: number[]) => {
  const s = [...arr].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Robust least squares removal of offset, drift and 100/200 Hz flicker, then light smoothing. */
function conditionOptical(x: number[]): number[] {
  let w = new Array(N).fill(1);
  let coef = [0, 0, 0, 0, 0, 0];
  const fit = (c: number[]) => x.map((v, i) => v - DESIGN[i].reduce((s, d, j) => s + d * c[j], 0));
  for (let it = 0; it < 3; it++) {
    const M = Array.from({ length: 6 }, () => new Array(6).fill(0));
    const b = new Array(6).fill(0);
    for (let i = 0; i < N; i++) {
      const r = DESIGN[i];
      for (let j = 0; j < 6; j++) {
        b[j] += w[i] * r[j] * x[i];
        for (let k = 0; k < 6; k++) M[j][k] += w[i] * r[j] * r[k];
      }
    }
    coef = solve(M, b);
    const res = fit(coef);
    const med = median(res);
    const mad = median(res.map((r) => Math.abs(r - med))) + 1e-9;
    w = res.map((r) => (Math.abs(r) < 3 * 1.4826 * mad ? 1 : 0) + 1e-3);
  }
  let c = fit(coef);
  for (let pass = 0; pass < 2; pass++) {
    c = c.map((v, i) => 0.25 * (c[i - 1] ?? v) + 0.5 * v + 0.25 * (c[i + 1] ?? v));
  }
  return c;
}

function parabolic(y: number[], i: number) {
  if (i > 0 && i < y.length - 1) {
    const d = y[i - 1] - 2 * y[i] + y[i + 1];
    if (d !== 0) return clamp((0.5 * (y[i - 1] - y[i + 1])) / d, -0.5, 0.5);
  }
  return 0;
}

const interp = (arr: number[], f: number) => {
  const i = Math.floor(f);
  const r = f - i;
  return arr[i] + ((arr[i + 1] ?? arr[i]) - arr[i]) * r;
};

export function extract(sim: SimResult, meta: { lat: number; ax: number }): Features {
  const p = sim.pressure;
  const o = sim.optical;
  const ps = p.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let k = -2; k <= 2; k++) {
      const q = p[i + k];
      if (q !== undefined) {
        s += q;
        n++;
      }
    }
    return s / n;
  });
  let iPeak = 0;
  ps.forEach((v, i) => {
    if (v > ps[iPeak]) iPeak = i;
  });
  const stimulus = ps[iPeak] > 5;
  const cleaned = conditionOptical(o);
  const diffs: number[] = [];
  for (let i = 1; i < N; i++) diffs.push(Math.abs(cleaned[i] - cleaned[i - 1]));
  const noiseMad = (1.4826 * median(diffs)) / Math.SQRT2 + 1e-6;
  const saturation = o.filter((v) => v >= 0.999).length / N;
  const p5 = [...o].sort((x, y) => x - y)[Math.floor(0.05 * N)];
  let broadN = 0;
  for (let i = 0; i < N; i++) {
    let s = 0;
    for (let k = -25; k < 25; k++) {
      const q = o[i + k];
      if (q !== undefined) s += q - p5;
    }
    if (s / 50 > 0.25) broadN++;
  }
  const f: Features = {
    events: false,
    stimulus,
    snr: NaN,
    p1: NaN,
    p2: NaN,
    t1: NaN,
    t2: NaN,
    saturation,
    broad: broadN / N,
    lat: meta.lat,
    ax: meta.ax,
  };
  if (!stimulus) return f;
  const base = median(cleaned);
  let i1 = 0;
  let i2 = iPeak + 1;
  for (let i = 0; i < iPeak; i++) if (cleaned[i] > cleaned[i1]) i1 = i;
  for (let i = iPeak + 1; i < N; i++) if (cleaned[i] > cleaned[i2]) i2 = i;
  const pr1 = cleaned[i1] - base;
  const pr2 = cleaned[i2] - base;
  const minProm = Math.max(6 * noiseMad, 0.02);
  if (!(pr1 >= minProm && pr2 >= minProm)) return f;
  const ti1 = i1 + parabolic(cleaned, i1);
  const ti2 = i2 + parabolic(cleaned, i2);
  return {
    ...f,
    events: true,
    snr: Math.min(pr1, pr2) / noiseMad,
    t1: ti1 * DT,
    t2: ti2 * DT,
    p1: interp(ps, ti1),
    p2: interp(ps, ti2),
  };
}

export function rules(f: Features): Reason[] {
  const r = new Set<Reason>();
  if (!f.events) r.add('signal_missing');
  if (Math.abs(f.lat) > LIMITS.maxLateralMm || Math.abs(f.ax) > LIMITS.maxAxialMm) r.add('alignment');
  if (f.broad > LIMITS.maxBroadFraction) r.add('blink');
  if (f.saturation > LIMITS.maxSaturationFraction) r.add('signal_quality');
  if (f.events && !(f.snr >= LIMITS.minSnr)) r.add('signal_quality');
  return [...r].sort();
}

/** Index of the inward and outward applanation peaks in a noise-free run. */
export function cleanPeaks(sim: SimResult) {
  let iPk = 0;
  sim.pulse.forEach((v, i) => {
    if (v > sim.pulse[iPk]) iPk = i;
  });
  let i1 = 0;
  let i2 = iPk + 1;
  for (let i = 0; i < iPk; i++) if (sim.ref[i] > sim.ref[i1]) i1 = i;
  for (let i = iPk + 1; i < N; i++) if (sim.ref[i] > sim.ref[i2]) i2 = i;
  return { i1, i2, P1: sim.pulse[i1], P2: sim.pulse[i2] };
}

export const linePath = (xs: number[], ys: number[]) =>
  xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join('');
