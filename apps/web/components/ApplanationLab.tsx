import React, { useEffect, useMemo, useRef, useState } from 'react';
import { REASON_TEXT, WINDOW_MS, cleanPeaks, extract, linePath, rules, simulate } from '../lib/simulator';
import { prefersReducedMotion, useIris } from './immersive/Iris';
import { Icon } from './ui/Primitives';

const X0 = 54;
const X1 = 740;
const pY = (v: number) => 190 - (Math.max(-5, Math.min(90, v)) / 90) * 170;
const oY = (v: number) => 340 - v * 125;
const tx = (t: number) => X0 + (t / WINDOW_MS) * (X1 - X0);

interface Controls {
  iop: number;
  cct: number;
  lat: number;
  ax: number;
  gain: number;
  flicker: number;
  blink: boolean;
}
const DEFAULTS: Controls = { iop: 17, cct: 545, lat: 0.2, ax: 0.2, gain: 1, flicker: 0.004, blink: false };

const SLIDERS: { key: keyof Omit<Controls, 'blink'>; label: string; min: number; max: number; step: number; fmt: (v: number) => string; hot?: boolean }[] = [
  { key: 'iop', label: 'Eye pressure (IOP)', min: 7, max: 44, step: 1, fmt: (v) => `${v.toFixed(0)} mmHg`, hot: true },
  { key: 'cct', label: 'Corneal thickness', min: 470, max: 620, step: 5, fmt: (v) => `${v.toFixed(0)} µm` },
  { key: 'lat', label: 'Lateral misalignment', min: 0, max: 2.5, step: 0.1, fmt: (v) => `${v.toFixed(1)} mm` },
  { key: 'ax', label: 'Axial misalignment', min: 0, max: 3, step: 0.1, fmt: (v) => `${v.toFixed(1)} mm` },
  { key: 'gain', label: 'Optical gain', min: 0.08, max: 3.6, step: 0.02, fmt: (v) => `× ${v.toFixed(2)}` },
  { key: 'flicker', label: 'Room light flicker', min: 0, max: 0.14, step: 0.002, fmt: (v) => v.toFixed(3) },
];

const fmt = (v: number, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');

/**
 * Interactive version of the repository simulator and deterministic rules.
 * Each puff replays in slow motion: the cornea flattens on the way in (P1) and
 * again on the way out (P2), and the light detector flashes each time.
 */
const ApplanationLab: React.FC = () => {
  const [c, setC] = useState<Controls>(DEFAULTS);
  const [seed, setSeed] = useState(21);
  const [prog, setProg] = useState(1);
  const raf = useRef(0);
  const iris = useIris();

  const sim = useMemo(() => simulate(c, seed), [c, seed]);
  const clean = useMemo(() => simulate({ ...c, blink: false, noise: 0 }, seed), [c, seed]);
  const f = useMemo(() => extract(sim, { lat: c.lat, ax: c.ax }), [sim, c.lat, c.ax]);
  const reasons = useMemo(() => rules(f), [f]);
  const ok = reasons.length === 0;
  const peaks = useMemo(() => cleanPeaks(clean), [clean]);

  const xs = useMemo(() => sim.t.map(tx), [sim]);
  const pPath = useMemo(() => linePath(xs, sim.pressure.map(pY)), [xs, sim]);
  const oPath = useMemo(() => linePath(xs, sim.optical.map(oY)), [xs, sim]);

  const replay = () => {
    cancelAnimationFrame(raf.current);
    if (prefersReducedMotion()) {
      setProg(1);
      return;
    }
    const start = performance.now();
    const dur = 2300;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setProg(p);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const fire = () => {
    setSeed((s) => (s * 48271 + 11) % 2147483647);
    iris.pulse(0.7);
    replay();
  };

  const k = Math.min(sim.t.length - 1, Math.round(prog * (sim.t.length - 1)));
  const yv = clean.y[k];
  const T = clean.T;
  const curve = yv < T ? 1 - yv / T : -0.55 * (1 - Math.exp(-(yv - T) / 12));
  const bulge = 54 * curve;
  const cx = 186 - 2 * bulge;
  const apex = 186 - bulge;
  const airLevel = clean.pulse[k] / clean.amp;
  const flash = Math.max(0, Math.min(1, (sim.optical[k] - 0.06) / 0.72));
  const flat = Math.abs(yv - T) < 3.5;
  const xc = tx(prog * WINDOW_MS);

  return (
    <div className="lab">
      <form className="glass lab-controls" onSubmit={(e) => e.preventDefault()} aria-label="Simulator settings">
        {SLIDERS.map((s) => (
          <div className={`ctrl ${s.hot ? 'hot' : ''}`} key={s.key}>
            <label htmlFor={`lab-${s.key}`}>
              <span>{s.label}</span>
              <output htmlFor={`lab-${s.key}`}>{s.fmt(c[s.key])}</output>
            </label>
            <input
              id={`lab-${s.key}`}
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={c[s.key]}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (Number.isFinite(v)) setC({ ...c, [s.key]: v });
              }}
            />
          </div>
        ))}
        <label className="toggle" htmlFor="lab-blink">
          <input id="lab-blink" type="checkbox" checked={c.blink} onChange={(e) => setC({ ...c, blink: e.target.checked })} />
          <span>Blink during the puff</span>
        </label>
        <div className="lab-buttons">
          <button type="button" className="btn" onClick={fire}>
            <Icon name="wind" size={18} /> Fire puff
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setC(DEFAULTS);
              setSeed(21);
              setProg(1);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="lab-stage">
        <div className="lab-views">
          <svg className="lab-cornea" viewBox="0 0 260 300" role="img" aria-label="Cornea under the air pulse, with the light source and detector">
            <path d="M186,40 C214,20 246,18 260,20" fill="none" stroke="#2d4373" strokeWidth="2.5" />
            <path d="M186,260 C214,280 246,282 260,280" fill="none" stroke="#2d4373" strokeWidth="2.5" />
            <path d={`M186,40 Q${cx},150 186,260 L212,246 L212,54 Z`} fill="#5f8fff" fillOpacity=".16" />
            <line x1="214" y1="62" x2="214" y2="128" stroke="#ff7a2e" strokeWidth="6" strokeLinecap="round" />
            <line x1="214" y1="172" x2="214" y2="238" stroke="#ff7a2e" strokeWidth="6" strokeLinecap="round" />
            <path d={`M186,40 Q${cx},150 186,260`} fill="none" stroke="#ecf1fa" strokeWidth="4" strokeLinecap="round" />
            <rect x="4" y="136" width="44" height="28" rx="6" fill="#13203f" stroke="#ff7a2e" strokeWidth="1.5" />
            <g stroke="#ffb24a" strokeLinecap="round" strokeWidth="2.5" style={{ opacity: 0.08 + 0.92 * airLevel }}>
              <line x1="52" y1="144" x2={Math.max(60, apex - 16)} y2="144" />
              <line x1="52" y1="150" x2={Math.max(60, apex - 8)} y2="150" />
              <line x1="52" y1="156" x2={Math.max(60, apex - 16)} y2="156" />
            </g>
            <rect x="34" y="34" width="34" height="20" rx="4" fill="#13203f" stroke="#5f8fff" strokeWidth="1.5" />
            <line x1="68" y1="48" x2={apex} y2="150" stroke="#5f8fff" strokeWidth="2" strokeOpacity=".8" />
            <line x1="68" y1="252" x2={apex} y2="150" stroke="#d6ff3e" strokeWidth="2.5" style={{ opacity: 0.06 + 0.94 * flash }} />
            <circle cx="52" cy="256" r={6 + 20 * flash} fill="#d6ff3e" style={{ opacity: flash * 0.5 }} />
            <rect x="34" y="246" width="34" height="20" rx="4" fill="#13203f" stroke="#d6ff3e" strokeWidth="1.8" />
            <text x="6" y="182" className="lab-tag">Nozzle</text>
            <text x="30" y="26" className="lab-tag">Light</text>
            <text x="22" y="290" className="lab-tag">Detector</text>
            <text x="252" y="296" textAnchor="end" className={`lab-state ${flat ? 'hot' : ''}`}>
              {flat ? 'Flat: flash' : yv > T ? 'Concave' : 'Curved'}
            </text>
          </svg>

          <svg className="lab-plot" viewBox="0 0 760 360" role="img" aria-label="Simulated air-pressure and optical traces for the chosen settings">
            <defs>
              <clipPath id="lab-clip">
                <rect x={X0 - 2} y="0" width={Math.max(0, xc - X0 + 4)} height="360" />
              </clipPath>
            </defs>
            {[0, 45, 90].map((v) => (
              <g key={v}>
                <line className={v === 0 ? 'ax0' : 'gridl'} x1={X0} x2={X1} y1={pY(v)} y2={pY(v)} />
                <text className="tick" x={X0 - 10} y={pY(v) + 5} textAnchor="end">{v}</text>
              </g>
            ))}
            <line className="gridl" x1={X0} x2={X1} y1={oY(1)} y2={oY(1)} />
            <line className="ax0" x1={X0} x2={X1} y1={oY(0)} y2={oY(0)} />
            <text className="tick" x={X0 - 10} y={oY(1) + 5} textAnchor="end">1</text>
            <text className="tick" x={X0 - 10} y={oY(0) + 5} textAnchor="end">0</text>
            <text className="tick" x={X1} y="356" textAnchor="end">32 ms</text>
            <text className="lab-axis ember" x={X0 + 10} y="36">Air pressure · mmHg</text>
            <text className="lab-axis fluor" x={X0 + 10} y={oY(1) + 18}>Optical detector</text>
            <line className="lab-t" x1={X0} x2={X1} y1={pY(sim.T)} y2={pY(sim.T)} />
            <text className="lab-t-l" x={X1 - 4} y={pY(sim.T) - 7} textAnchor="end">T = IOP + Rc</text>
            <g clipPath="url(#lab-clip)">
              <path d={pPath} className="trace ember" />
              <path d={oPath} className="trace fluor" />
            </g>
            {f.events && prog > 0.98 && (
              <g className="lab-marks">
                {[
                  { t: f.t1, p: f.p1, n: 'P1' },
                  { t: f.t2, p: f.p2, n: 'P2' },
                ].map((m) => (
                  <g key={m.n}>
                    <line x1={tx(m.t)} x2={tx(m.t)} y1="16" y2={oY(0)} />
                    <text x={tx(m.t)} y="12" textAnchor="middle">{`${m.n} ${m.p.toFixed(1)}`}</text>
                  </g>
                ))}
              </g>
            )}
            {prog < 1 && <line x1={xc} x2={xc} y1="10" y2={oY(0)} className="lab-cursor" />}
          </svg>
        </div>

        <div className={`verdict ${ok ? 'ok' : 'bad'}`} aria-live="polite">
          <span className="verdict-state">{ok ? 'Passes the rules' : 'Rejected'}</span>
          <p>
            {ok
              ? `Midpoint ½(P1+P2) = ${fmt((f.p1 + f.p2) / 2)} mmHg would go on to the learned gates and the estimator.`
              : `${reasons.map((r) => REASON_TEXT[r]).join(' · ')}. No pressure value is reported.`}
          </p>
        </div>

        <dl className={`readouts ${ok ? '' : 'dim'}`}>
          <div><dt>P1</dt><dd>{f.events ? fmt(f.p1) : '—'}</dd></div>
          <div><dt>P2</dt><dd>{f.events ? fmt(f.p2) : '—'}</dd></div>
          <div><dt>½(P1+P2)</dt><dd>{f.events && ok ? fmt((f.p1 + f.p2) / 2) : '—'}</dd></div>
          <div><dt>Hysteresis</dt><dd>{f.events ? fmt(f.p1 - f.p2) : '—'}</dd></div>
          <div><dt>SNR</dt><dd>{f.events ? fmt(f.snr, 0) : '—'}</dd></div>
          <div><dt>True T</dt><dd>{`${fmt(sim.T)}`}<small>{` = ${c.iop} ${sim.Rc >= 0 ? '+' : '−'} ${fmt(Math.abs(sim.Rc))}`}</small></dd></div>
        </dl>
        <p className="src">
          Repository simulator and deterministic rules, re-implemented in the browser with the synthetic development limits. The learned gates and
          estimators are not running here. Noise-free peaks: P1 {peaks.P1.toFixed(1)}, P2 {peaks.P2.toFixed(1)} mmHg.
        </p>
      </div>
    </div>
  );
};

export default ApplanationLab;
