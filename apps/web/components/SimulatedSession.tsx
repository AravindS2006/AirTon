import React, { useEffect, useRef, useState } from 'react';
import type { Reason } from '../lib/simulator';
import { REASON_TEXT, extract, rng, rules, simulate } from '../lib/simulator';
import { prefersReducedMotion, useIris } from './immersive/Iris';
import { Icon } from './ui/Primitives';

interface Result {
  n: number;
  ok: boolean;
  mid: number | null;
  reasons: Reason[];
}

/**
 * A practice run of one eye with three simulated puffs. Conditions are drawn at
 * random (occasional misalignment, blinks and weak signal) so rejections happen
 * the way the specification expects: with a reason and no number.
 */
const SimulatedSession: React.FC<{ eye?: 'OD' | 'OS' }> = ({ eye = 'OD' }) => {
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  const iris = useIris();
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResults([]);
    setRunning(true);
    const seed = Math.floor(Math.random() * 1e9);
    const { u } = rng(seed);
    const gap = prefersReducedMotion() ? 0 : 900;
    for (let n = 0; n < 3; n++) {
      const misaligned = u() < 0.2;
      const p = {
        iop: 16 + 2 * u(),
        cct: 530 + 40 * u(),
        lat: misaligned ? 1.1 + u() : 0.1 + 0.4 * u(),
        ax: 0.1 + 0.6 * u(),
        gain: u() < 0.1 ? 0.12 : 0.85 + 0.3 * u(),
        blink: u() < 0.15,
      };
      const sim = simulate(p, seed + n);
      const f = extract(sim, { lat: p.lat, ax: p.ax });
      const reasons = rules(f);
      const res: Result = { n: n + 1, ok: reasons.length === 0, mid: reasons.length === 0 ? (f.p1 + f.p2) / 2 : null, reasons };
      timers.current.push(
        window.setTimeout(() => {
          iris.pulse(0.45);
          setResults((r) => [...r, res]);
          if (n === 2) setRunning(false);
        }, gap * (n + 1)),
      );
    }
  };

  const passed = results.filter((r) => r.ok).length;
  return (
    <div className="glass practice">
      <div className="practice-head">
        <div>
          <span className="eyebrow">Simulated session · {eye === 'OD' ? 'right eye' : 'left eye'}</span>
          <h3 className="h3">Practice the puff</h3>
        </div>
        <button type="button" className="btn" onClick={run} disabled={running}>
          <Icon name="play" size={16} /> {running ? 'Puffing…' : results.length ? 'Run again' : 'Run simulation'}
        </button>
      </div>
      <ol className="practice-list" aria-live="polite">
        {[1, 2, 3].map((n) => {
          const r = results.find((x) => x.n === n);
          return (
            <li key={n} className={r ? (r.ok ? 'ok' : 'bad') : running ? 'wait' : ''}>
              <span className="practice-n">{n}</span>
              {r ? (
                r.ok ? (
                  <span>
                    Passed the rules · applanation midpoint <b>{(r.mid as number).toFixed(1)} mmHg</b>
                  </span>
                ) : (
                  <span>
                    Rejected · {r.reasons.map((x) => REASON_TEXT[x]).join(', ')} · <b>no value</b>
                  </span>
                )
              ) : (
                <span className="muted">{running ? 'Waiting for the puff…' : 'Not run yet'}</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="src">
        {results.length === 3 ? `${passed} of 3 attempts passed. ` : ''}Simulation only: no device is connected. The midpoint is a simulator feature, not an estimate from a
        trained model, and it is not added to your history.
      </p>
    </div>
  );
};

export default SimulatedSession;
