import React, { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DEMO_API, getHealth, predictRetinal, simulateIop } from '../services/demoApi';
import type { Health, IopSimulation, RetinalResult } from '../services/demoApi';

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

const Card: React.FC<{ title: string; eyebrow: string; children: React.ReactNode }> = ({ title, eyebrow, children }) => (
  <section className="bg-white rounded-lg shadow-md p-6 md:p-8">
    <p className="text-xs font-semibold tracking-wider uppercase text-airton-teal mb-1">{eyebrow}</p>
    <h2 className="text-2xl font-bold text-airton-blue-dark mb-4">{title}</h2>
    {children}
  </section>
);

const ApiNotice: React.FC<{ health: Health | null; error: string | null }> = ({ health, error }) => {
  if (health) {
    return (
      <p className="text-sm text-airton-gray">
        Connected to the local demo API. IOP model <code>{health.iop_model ?? 'not loaded'}</code>; retinal model{' '}
        <code>{health.retinal_model ?? 'not loaded'}</code>.
      </p>
    );
  }
  return (
    <div role="alert" className="text-sm bg-red-50 border-l-4 border-red-400 text-red-900 p-4">
      <p className="font-semibold">The demo API is not reachable at {DEMO_API}.</p>
      <p className="mt-1">Start it from the repository folder with <code>python scripts/serve_demo_api.py</code>, then reload this page.</p>
      {error && <p className="mt-1 opacity-75">Details: {error}</p>}
    </div>
  );
};

const IopDemo: React.FC<{ health: Health | null }> = ({ health }) => {
  const [scenario, setScenario] = useState('clean');
  const [seed, setSeed] = useState(1);
  const [data, setData] = useState<IopSimulation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!health?.iop_model) return;
    let cancelled = false;
    setBusy(true);
    setError(null);
    simulateIop(scenario, seed)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [scenario, seed, health]);

  const chartData = useMemo(() => (data ? data.time_ms.map((t, i) => ({
    t, pressure: data.pressure_mmhg[i], optical: data.optical[i],
  })) : []), [data]);

  const result = data?.result;
  return (
    <Card eyebrow="Simulation - no hardware" title="How an air-puff reading works">
      <p className="text-airton-gray mb-4">
        A short puff of air gently flattens the cornea twice: once on the way in and once on the way out. A light sensor
        flashes at each flattening. The air pressure at those two moments (P1 and P2) reveals the eye pressure. The
        signals below are <strong>simulated</strong>. A real reading needs the AirTon device.
      </p>
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Simulated scenario">
        {SCENARIO_ORDER.filter((key) => !health || key in health.scenarios).map((key) => (
          <button key={key} type="button" aria-pressed={scenario === key} onClick={() => setScenario(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-airton-teal ${
              scenario === key ? 'bg-airton-blue text-white border-airton-blue' : 'bg-white text-airton-blue-dark border-gray-300 hover:border-airton-blue'}`}>
            {health?.scenarios[key] ?? key}
          </button>
        ))}
        <button type="button" onClick={() => setSeed((s) => s + 1)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-airton-teal hover:underline focus:outline-none focus:ring-2 focus:ring-airton-teal">
          New sample
        </button>
      </div>
      {error && <p role="alert" className="text-red-700 mb-3">{error}</p>}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <figure className="lg:col-span-2 h-72" aria-label="Simulated pressure and optical signals">
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="t" type="number" domain={[0, 32]} tickCount={9} unit=" ms" fontSize={12} />
                <YAxis yAxisId="p" fontSize={12} unit=" mmHg" width={72} domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} allowDataOverflow />
                <YAxis yAxisId="o" orientation="right" fontSize={12} domain={[0, 1]} width={40} />
                <Tooltip formatter={(v: number, name: string) => [v.toFixed(name === 'Air pressure' ? 1 : 3), name]}
                  labelFormatter={(t: number) => `${t.toFixed(1)} ms`} />
                <Legend verticalAlign="top" height={28} />
                <Line yAxisId="p" dataKey="pressure" name="Air pressure" stroke="#00529B" dot={false} strokeWidth={2} isAnimationActive={false} />
                <Line yAxisId="o" dataKey="optical" name="Light sensor" stroke="#00A89D" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                {data?.applanation_times_ms.map((t, i) => (
                  <ReferenceLine key={t} yAxisId="p" x={t} stroke="#9CA3AF" strokeDasharray="4 4"
                    label={{ value: i === 0 ? 'P1' : 'P2', position: 'insideTopLeft', fontSize: 12 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </figure>
        <div role="status" aria-live="polite" aria-busy={busy} className="bg-airton-blue-light rounded-lg p-5">
          {!result && <p className="text-airton-gray">{health?.iop_model ? 'Loading simulation...' : 'IOP model not loaded.'}</p>}
          {result?.status === 'pass' && result.iop_estimate_mmhg !== null && (
            <>
              <p className="text-sm text-airton-gray">Estimated pressure (simulated)</p>
              <p className="text-4xl font-extrabold text-airton-blue-dark">{result.iop_estimate_mmhg.toFixed(1)} <span className="text-lg font-semibold">mmHg</span></p>
              {result.interval_mmhg && (
                <p className="text-sm text-airton-gray mt-1">
                  {Math.round(result.interval_coverage_target * 100)}% range {result.interval_mmhg[0].toFixed(1)} to {result.interval_mmhg[1].toFixed(1)} mmHg
                </p>
              )}
            </>
          )}
          {result?.status === 'reject' && (
            <>
              <p className="text-sm text-airton-gray">Reading rejected: no number is shown</p>
              <ul className="mt-2 list-disc list-inside text-airton-blue-dark">
                {result.reasons.map((r) => <li key={r}>{REASONS[r] ?? r}</li>)}
              </ul>
            </>
          )}
          {data && (
            <p className="text-xs text-airton-gray mt-4">
              The simulator&apos;s true value was {data.simulated_true_iop_mmhg.toFixed(1)} mmHg.
              {data.p1_mmhg !== null && data.p2_mmhg !== null && <> P1 {data.p1_mmhg.toFixed(1)}, P2 {data.p2_mmhg.toFixed(1)} mmHg.</>}
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-airton-gray mt-4">{data?.disclaimer ?? 'Simulated signals from an assumed physics model.'}</p>
    </Card>
  );
};

const RetinalDemo: React.FC<{ health: Health | null }> = ({ health }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<RetinalResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

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
  return (
    <Card eyebrow="Research model - not a diagnosis" title="Retinal photograph research model">
      <p className="text-airton-gray mb-2">
        An EfficientNet-B0 trained for a college research project on the LAG fundus database (Li et al., CVPR 2019),
        used with the LAG team&apos;s permission for academic use. It estimates how closely a full-field colour fundus
        photograph resembles the images LAG labelled &quot;suspicious glaucoma&quot;.
      </p>
      <p className="text-sm bg-amber-50 border-l-4 border-amber-400 text-amber-900 p-3 mb-4">
        Only upload images you are allowed to share and that do not identify a person. Images are analysed in memory and
        not stored. This is not a medical test. Anyone with eye concerns should see an eye-care professional.
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 cursor-pointer hover:border-airton-blue focus-within:ring-2 focus-within:ring-airton-teal">
          <span className="text-sm font-semibold text-airton-blue-dark">Choose fundus photo</span>
          <input type="file" accept="image/jpeg,image/png" onChange={choose} className="sr-only" />
        </label>
        <button type="button" onClick={analyse} disabled={!file || busy || !health?.retinal_model}
          className="bg-airton-blue text-white font-semibold px-6 py-2 rounded-lg hover:bg-airton-blue-dark disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-airton-teal">
          {busy ? 'Analysing...' : 'Analyse'}
        </button>
        {file && <span className="text-sm text-airton-gray truncate max-w-xs">{file.name}</span>}
      </div>
      {error && <p role="alert" className="text-red-700 mb-3">{error}</p>}
      <div className="grid md:grid-cols-2 gap-6">
        {preview && (
          <figure>
            <img src={preview} alt="Uploaded fundus photograph" className="rounded-lg w-full max-w-sm aspect-square object-cover bg-black" />
            <figcaption className="text-xs text-airton-gray mt-1">Your image</figcaption>
          </figure>
        )}
        <div role="status" aria-live="polite" aria-busy={busy}>
          {result?.status === 'rejected' && (
            <div className="bg-gray-50 rounded-lg p-5">
              <p className="font-semibold text-airton-blue-dark">No prediction made</p>
              <p className="text-airton-gray mt-1">{result.message}</p>
              {result.fundus_check?.reasons.length ? (
                <ul className="list-disc list-inside text-sm text-airton-gray mt-2">
                  {result.fundus_check.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              ) : null}
            </div>
          )}
          {result?.status === 'ok' && probability !== null && (
            <div className="bg-airton-blue-light rounded-lg p-5">
              <p className="text-sm text-airton-gray">Research model score</p>
              <p className="text-4xl font-extrabold text-airton-blue-dark">{(probability * 100).toFixed(1)}%</p>
              <div className="h-2 bg-white rounded mt-2" aria-hidden="true">
                <div className="h-2 rounded bg-airton-teal" style={{ width: `${Math.max(2, probability * 100)}%` }} />
              </div>
              <p className="mt-3 text-airton-blue-dark">
                {result.above_research_threshold ? 'Above' : 'Below'} the research threshold ({((result.threshold ?? 0) * 100).toFixed(1)}%):
                resembles &quot;{result.above_research_threshold ? result.label_if_above : result.label_if_below}&quot; images.
              </p>
              {result.heatmap_png_base64 && (
                <figure className="mt-4">
                  <img src={`data:image/png;base64,${result.heatmap_png_base64}`} alt="Grad-CAM heatmap over the photograph"
                    className="rounded-lg w-full max-w-xs" />
                  <figcaption className="text-xs text-airton-gray mt-1">{result.heatmap_note}</figcaption>
                </figure>
              )}
            </div>
          )}
        </div>
      </div>
      <details className="mt-6 text-sm text-airton-gray">
        <summary className="cursor-pointer font-semibold text-airton-blue-dark">What the results mean, and their limits</summary>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>On LAG&apos;s own held-out test images: AUROC 0.991, sensitivity 95.7%, specificity 94.9%.</li>
          <li>On 183 zoomed optic-disc crops from another source it scored near chance (AUROC 0.59). Use full-field fundus photographs only.</li>
          <li>Images unlike the training photographs are refused, but this check cannot catch every unsuitable image.</li>
          <li>A score is not a diagnosis. Glaucoma is diagnosed by an eye-care professional using several examinations.</li>
          <li>Trained on academic-use data; not part of any product. AirTon&apos;s planned product measures eye pressure, not photographs.</li>
        </ul>
      </details>
    </Card>
  );
};

const ResearchDemo: React.FC = () => {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal).then(setHealth).catch((e: Error) => {
      if (e.name !== 'AbortError') setError(e.message);
    });
    return () => controller.abort();
  }, []);

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-6 py-12 space-y-8 max-w-6xl">
        <header>
          <h1 className="text-4xl font-extrabold text-airton-blue-dark mb-3">Research demonstrations</h1>
          <p className="text-lg text-airton-gray max-w-3xl mb-4">
            Two college research models from the AirTon project, running on a local demo server. Neither is a medical
            device, and neither result should guide anyone&apos;s eye care.
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
