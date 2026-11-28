// Client for the local AirTon research demo API (python scripts/serve_demo_api.py).
// Research and simulation only: no clinical service sits behind these calls.

export const DEMO_API = (import.meta.env.VITE_AIRTON_DEMO_API || 'http://127.0.0.1:8770').replace(/\/$/, '');

export interface Health {
  status: string;
  retinal_model: string | null;
  iop_model: string | null;
  scenarios: Record<string, string>;
}

export interface IopResult {
  status: 'pass' | 'reject';
  reasons: string[];
  iop_estimate_mmhg: number | null;
  interval_mmhg: [number, number] | null;
  interval_coverage_target: number;
  model_id: string;
}

export interface IopSimulation {
  scenario: string;
  description: string;
  time_ms: number[];
  pressure_mmhg: number[];
  optical: number[];
  applanation_times_ms: number[];
  p1_mmhg: number | null;
  p2_mmhg: number | null;
  simulated_true_iop_mmhg: number;
  result: IopResult;
  disclaimer: string;
}

export interface RetinalResult {
  status: 'ok' | 'rejected';
  probability: number | null;
  threshold?: number;
  above_research_threshold?: boolean;
  label_if_above?: string;
  label_if_below?: string;
  heatmap_png_base64?: string;
  heatmap_note?: string;
  message?: string;
  fundus_check?: { looks_like_fundus: boolean; reasons: string[] };
  model_id: string;
  disclaimer: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({ error: 'Unreadable response' }));
  if (!response.ok && response.status !== 422) {
    throw new Error((body as { error?: string }).error || `Request failed (${response.status})`);
  }
  return body as T;
}

export async function getHealth(signal?: AbortSignal): Promise<Health> {
  return readJson<Health>(await fetch(`${DEMO_API}/health`, { signal }));
}

export async function simulateIop(scenario: string, seed: number): Promise<IopSimulation> {
  const query = new URLSearchParams({ scenario, seed: String(seed) });
  return readJson<IopSimulation>(await fetch(`${DEMO_API}/v1/iop/simulate?${query}`));
}

export async function predictRetinal(file: File): Promise<RetinalResult> {
  const response = await fetch(`${DEMO_API}/v1/retinal/predict`, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  return readJson<RetinalResult>(response);
}
