import React, { useEffect, useMemo, useState } from 'react';
import { DEMO_API, getHealth, predictRetinal, simulateIop } from '../services/demoApi';
import type { Health, IopSimulation, RetinalResult } from '../services/demoApi';
import { useIris } from './immersive/Iris';
import { EvidenceLadder, Icon } from './ui/Primitives';

const REASONS: Record<string, string> = {
  alignment: 'Device not centred on the eye',
  blink: 'Eyelid blink during the puff',
  signal_missing: 'No clear corneal flattening detected',
  signal_quality: 'Optical signal quality too low',
  out_of_domain: 'Signal unlike anything the model was trained on',
  estimate_uncertain: 'Estimate too uncertain to report',
  calibration_expired: 'Device calibration expired',
  clock_untrusted: 'Device clock not trusted',
};

const SCENARIO_ORDER = ['clean', 'high_pressure', 'blink', 'misaligned', 'low_signal'];
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/* Waveform plot in the same visual language as the landing-page lab. */
const X0 = 54;
const X1 = 740;
const pY = (v: number) => 186 - (Math.max(0, Math.min(80, v)) / 80) * 166;
const oY = (v: number) => 322 - Math.max(0, Math.min(1, v)) * 112;
const line = (xs: number[], ys: number[]) => xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join('');

const Waveforms: React.FC<{ data: IopSimulation }> = ({ data }) => {
  const span = Math.max(32, data.time_ms[data.time_ms.length - 1] ?? 32);
  const tx = (t: number) => X0 + (t / span) * (X1 - X0);
  const xs = data.time_ms.map(tx);
  return (
    <svg className="lab-plot" viewBox="0 0 760 344" role="img" aria-label={`Simulated pressure and light-sensor signals for the ${data.scenario} scenario`}>
      {[0, 40, 80].map((v) => (
        <g key={v}>
          <line className={v === 0 ? 'ax0' : 'gridl'} x1={X0} x2={X1} y1={pY(v)} y2={pY(v)} />
          <text className="tick" x={X0 - 10} y={pY(v) + 5} textAnchor="end">{v}</text>
        </g>
      ))}
      <line className="gridl" x1={X0} x2={X1} y1={oY(1)} y2={oY(1)} />
      <line className="ax0" x1={X0} x2={X1} y1={oY(0)} y2={oY(0)} />
      <text className="tick" x={X0 - 10} y={oY(1) + 5} textAnchor="end">1</text>
      <text className="tick" x={X0 - 10} y={oY(0) + 5} textAnchor="end">0</text>
      <text className="tick" x={X1} y="341" textAnchor="end">{`${Math.round(span)} ms`}</text>
      <text className="lab-axis ember" x={X0 + 10} y="34">Air pressure · mmHg</text>
      <text className="lab-axis fluor" x={X0 + 10} y={oY(1) + 18}>Light sensor</text>
      <path d={line(xs, data.pressure_mmhg.map(pY))} className="trace ember" />
      <path d={line(xs, data.optical.map(oY))} className="trace fluor" />
      <g className="lab-marks">
        {data.applanation_times_ms.slice(0, 2).map((t, i) => (
          <g key={t}>
            <line x1={tx(t)} x2={tx(t)} y1="16" y2={oY(0)} />
            <text x={tx(t)} y="12" textAnchor="middle">{i === 0 ? 'P1' : 'P2'}</text>
          </g>
        ))}
      </g>
    </svg>
  );
};

const ApiNotice: React.FC<{ health: Health | null; error: string | null }> = ({ health, error }) => {
  if (health) {
    return (
      <p className="api-ok">
        <span className="state-chip d-reviewed"><i aria-hidden="true" />Connected</span>
        <span>
          Local demo API. IOP model <code>{health.iop_model ?? 'not loaded'}</code>; retinal model <code>{health.retinal_model ?? 'not loaded'}</code>.
        </span>
      </p>
    );
  }
  return (
    <div role="alert" className="api-down">
      <p className="h4">The demo API is not reachable at {DEMO_API}.</p>
      <p>
        Start it from the repository folder with <code>python scripts/serve_demo_api.py</code>, then reload this page.
      </p>
      {error && <p className="src">Details: {error}</p>}
    </div>
  );
};

const IopDemo: React.FC<{ health: Health | null }> = ({ health }) => {
  const [scenario, setScenario] = useState('clean');
  const [seed, setSeed] = useState(1);
  const [data, setData] = useState<IopSimulation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iris = useIris();

  useEffect(() => {
    if (!health?.iop_model) return undefined;
    let cancelled = false;
    setBusy(true);
    setError(null);
    simulateIop(scenario, seed)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          iris.pulse(0.5);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scenario, seed, health, iris]);

  const result = data?.result;
  const scenarios = SCENARIO_ORDER.filter((key) => !health || key in health.scenarios);
  return (
    <section className="glass pad demo-sec" aria-labelledby="iop-demo-title">
      <div className="section-meta">
        <span className="eyebrow">Simulation · no hardware</span>
        <EvidenceLadder lit={['synthetic']} compact />
      </div>
      <h2 className="display display-sm" id="iop-demo-title">
        How an air-puff reading <em>works</em>
      </h2>
      <p className="body demo-intro">
        A short puff of air gently flattens the cornea twice: once on the way in and once on the way out. A light sensor flashes at each flattening. The air
        pressure at those two moments (P1 and P2) reveals the eye pressure. The signals below are <b>simulated</b> and run through the repository&apos;s IOP
        engine. A real reading needs the AirTon device.
      </p>
      <div className="segmented" role="group" aria-label="Simulated scenario">
        {scenarios.map((key) => (
          <button key={key} type="button" className="seg" aria-pressed={scenario === key} onClick={() => setScenario(key)}>
            {health?.scenarios[key] ?? key}
          </button>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSeed((s) => s + 1)}>
          <Icon name="wind" size={16} /> New sample
        </button>
      </div>
      {error && (
        <p role="alert" className="c-alarm">
          {error}
        </p>
      )}
      <div className="demo-grid">
        <div className="lab-views demo-plot">{data ? <Waveforms data={data} /> : <div className="skeleton"><span /></div>}</div>
        <div role="status" aria-live="polite" aria-busy={busy} className={`demo-result ${result?.status === 'pass' ? 'ok' : result?.status === 'reject' ? 'bad' : ''}`}>
          {!result && <p className="muted">{health?.iop_model ? 'Loading simulation…' : 'IOP model not loaded.'}</p>}
          {result?.status === 'pass' && result.iop_estimate_mmhg !== null && (
            <>
              <span className="eyebrow">Estimated pressure · simulated</span>
              <p className="demo-value">
                <span className="num">{result.iop_estimate_mmhg.toFixed(1)}</span>
                <span className="eye-unit">mmHg</span>
              </p>
              {result.interval_mmhg && (
                <p className="body">
                  {Math.round(result.interval_coverage_target * 100)}% range {result.interval_mmhg[0].toFixed(1)} to {result.interval_mmhg[1].toFixed(1)} mmHg
                </p>
              )}
            </>
          )}
          {result?.status === 'reject' && (
            <>
              <span className="eyebrow c-alarm">Reading rejected · no number is shown</span>
              <ul className="reason-list">
                {result.reasons.map((r) => (
                  <li key={r}>
                    <Icon name="x" size={14} /> {REASONS[r] ?? r}
                  </li>
                ))}
              </ul>
            </>
          )}
          {data && (
            <p className="src">
              The simulator&apos;s true value was {data.simulated_true_iop_mmhg.toFixed(1)} mmHg.
              {data.p1_mmhg !== null && data.p2_mmhg !== null && (
                <>
                  {' '}
                  P1 {data.p1_mmhg.toFixed(1)}, P2 {data.p2_mmhg.toFixed(1)} mmHg.
                </>
              )}
            </p>
          )}
        </div>
      </div>
      <p className="src">{data?.disclaimer ?? 'Simulated signals from an assumed physics model.'}</p>
    </section>
  );
};

const RetinalDemo: React.FC<{ health: Health | null }> = ({ health }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<RetinalResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const choose = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null;
    setResult(null);
    setError(null);
    if (chosen && !['image/jpeg', 'image/png'].includes(chosen.type)) {
      setError('Please choose a JPEG or PNG image.');
      return;
    }
    if (chosen && chosen.size > MAX_UPLOAD_BYTES) {
      setError('Please choose an image smaller than 8 MB.');
      return;
    }
    setFile(chosen);
    setPreview(chosen ? URL.createObjectURL(chosen) : null);
  };

  const analyse = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await predictRetinal(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const probability = result?.probability ?? null;
  const threshold = result?.threshold ?? null;
  const pct = useMemo(() => (probability === null ? 0 : Math.max(2, probability * 100)), [probability]);
  return (
    <section className="glass pad demo-sec" aria-labelledby="retinal-demo-title">
      <div className="section-meta">
        <span className="eyebrow">Research model · not a diagnosis</span>
      </div>
      <h2 className="display display-sm" id="retinal-demo-title">
        Retinal photograph <em>research model</em>
      </h2>
      <p className="body demo-intro">
        An EfficientNet-B0 trained for a college research project on the LAG fundus database (Li et al., CVPR 2019), used with the LAG team&apos;s permission for
        academic use. It estimates how closely a full-field colour fundus photograph resembles the images LAG labelled &quot;suspicious glaucoma&quot;.
      </p>
      <div className="dash-banner">
        <Icon name="shield" size={18} />
        <span>
          Only upload images you are allowed to share and that do not identify a person. Images are analysed in memory and not stored. This is not a medical test.
          Anyone with eye concerns should see an eye-care professional.
        </span>
      </div>
      <div className="upload-row">
        <label className="btn btn-ghost btn-sm file-btn">
          <Icon name="plus" size={16} /> Choose fundus photo
          <input type="file" accept="image/jpeg,image/png" onChange={choose} className="sr-only" />
        </label>
        <button type="button" className="btn btn-sm" onClick={analyse} disabled={!file || busy || !health?.retinal_model}>
          {busy ? 'Analysing…' : 'Analyse'}
        </button>
        {file && <span className="file-name">{file.name}</span>}
      </div>
      {error && (
        <p role="alert" className="c-alarm">
          {error}
        </p>
      )}
      <div className="demo-grid retinal">
        {preview && (
          <figure className="demo-figure">
            <img src={preview} alt="Uploaded fundus photograph" />
            <figcaption className="src">Your image</figcaption>
          </figure>
        )}
        <div role="status" aria-live="polite" aria-busy={busy}>
          {result?.status === 'rejected' && (
            <div className="demo-result bad">
              <span className="eyebrow c-alarm">No prediction made</span>
              <p className="body">{result.message}</p>
              {result.fundus_check?.reasons.length ? (
                <ul className="reason-list">
                  {result.fundus_check.reasons.map((r) => (
                    <li key={r}>
                      <Icon name="x" size={14} /> {r}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
          {result?.status === 'ok' && probability !== null && (
            <div className="demo-result">
              <span className="eyebrow">Research model score</span>
              <p className="demo-value">
                <span className="num">{(probability * 100).toFixed(1)}%</span>
              </p>
              <div className="score-track" aria-hidden="true">
                <span className="score-fill" style={{ width: `${pct}%` }} />
                {threshold !== null && <span className="score-threshold" style={{ left: `${threshold * 100}%` }} />}
              </div>
              <p className="body">
                {result.above_research_threshold ? 'Above' : 'Below'} the research threshold ({((threshold ?? 0) * 100).toFixed(1)}%): resembles &quot;
                {result.above_research_threshold ? result.label_if_above : result.label_if_below}&quot; images.
              </p>
              {result.heatmap_png_base64 && (
                <figure className="demo-figure small">
                  <img src={`data:image/png;base64,${result.heatmap_png_base64}`} alt="Grad-CAM heatmap over the photograph" />
                  <figcaption className="src">{result.heatmap_note}</figcaption>
                </figure>
              )}
            </div>
          )}
        </div>
      </div>
      <details className="limits">
        <summary>What the results mean, and their limits</summary>
        <ul>
          <li>On LAG&apos;s own held-out test images: AUROC 0.991, sensitivity 95.7%, specificity 94.9%.</li>
          <li>On 183 zoomed optic-disc crops from another source it scored near chance (AUROC 0.59). Use full-field fundus photographs only.</li>
          <li>Images unlike the training photographs are refused, but this check cannot catch every unsuitable image.</li>
          <li>A score is not a diagnosis. Glaucoma is diagnosed by an eye-care professional using several examinations.</li>
          <li>Trained on academic-use data; not part of any product. AirTon&apos;s planned product measures eye pressure, not photographs.</li>
        </ul>
      </details>
    </section>
  );
};

const ResearchDemo: React.FC = () => {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then(setHealth)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="page">
      <div className="wrap stack-lg">
        <header className="page-head">
          <span className="eyebrow">Research demo</span>
          <h1 className="display">
            Research <em>demonstrations</em>
          </h1>
          <p className="lead">
            Two college research models from the AirTon project, running on a local demo server. Neither is a medical device, and neither result should guide
            anyone&apos;s eye care.
          </p>
          <ApiNotice health={health} error={error} />
        </header>
        <IopDemo health={health} />
        <RetinalDemo health={health} />
      </div>
    </div>
  );
};

export default ResearchDemo;
