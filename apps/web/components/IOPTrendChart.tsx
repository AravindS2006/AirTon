import React, { useId, useMemo, useState } from 'react';
import type { SessionPoint } from '../types';
import { DeliveryChip } from './ui/Primitives';

const W = 920;
const H = 360;
const L = 52;
const R = 900;
const T = 24;
const B = 290;

/** Line through non-null points, broken where a session has no accepted reading. */
function segments(xs: number[], ys: (number | null)[]) {
  const out: string[] = [];
  let cur = '';
  ys.forEach((y, i) => {
    if (y === null) {
      if (cur) out.push(cur);
      cur = '';
      return;
    }
    cur += `${cur ? 'L' : 'M'}${xs[i].toFixed(1)},${y.toFixed(1)}`;
  });
  if (cur) out.push(cur);
  return out;
}

function band(xs: number[], mid: (number | null)[], hw: (number | null)[], y: (v: number) => number) {
  const polys: string[] = [];
  let top: string[] = [];
  let bot: string[] = [];
  const flush = () => {
    if (top.length > 1) polys.push(`${top.join(' ')} ${bot.reverse().join(' ')}`);
    top = [];
    bot = [];
  };
  mid.forEach((m, i) => {
    const h = hw[i];
    if (m === null || h === null) return flush();
    top.push(`${xs[i].toFixed(1)},${y(m + h).toFixed(1)}`);
    bot.push(`${xs[i].toFixed(1)},${y(m - h).toFixed(1)}`);
  });
  flush();
  return polys;
}

/** Per-eye pressure history with uncertainty bands and rejected attempts. Fictional data. */
const IOPTrendChart: React.FC<{ points: SessionPoint[]; title?: string }> = ({ points, title = 'Pressure history' }) => {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const vals = points.flatMap((p) => [p.od.iop, p.os.iop]).filter((v): v is number => v !== null);
  const lo = Math.min(8, Math.floor(Math.min(...vals) - 5));
  const hi = Math.max(32, Math.ceil(Math.max(...vals) + 5));
  const y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T);
  const xs = useMemo(() => points.map((_, i) => L + (points.length === 1 ? 0.5 : i / (points.length - 1)) * (R - L)), [points]);
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / 5) * 5; v <= hi; v += 5) ticks.push(v);
  const od = points.map((p) => (p.od.iop === null ? null : y(p.od.iop)));
  const os = points.map((p) => (p.os.iop === null ? null : y(p.os.iop)));
  const maxRej = Math.max(1, ...points.map((p) => p.od.rejected + p.os.rejected));

  const pick = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * W;
    let best = 0;
    xs.forEach((v, i) => {
      if (Math.abs(v - x) < Math.abs(xs[best] - x)) best = i;
    });
    setHover(best);
  };
  const h = hover === null ? null : points[hover];
  const latest = points[points.length - 1];

  return (
    <figure className="trend">
      <figcaption className="trend-head">
        <span className="eyebrow">{title}</span>
        <span className="trend-legend">
          <span><i className="lg-od" /> Right eye · OD</span>
          <span><i className="lg-os" /> Left eye · OS</span>
          <span><i className="lg-band" /> Uncertainty interval</span>
          <span><i className="lg-rej" /> Rejected attempts</span>
        </span>
      </figcaption>
      <div className="trend-box">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby={`${id}-desc`}
          tabIndex={0}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(points.length - 1)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setHover((v) => Math.max(0, (v ?? points.length - 1) - 1));
            if (e.key === 'ArrowRight') setHover((v) => Math.min(points.length - 1, (v ?? 0) + 1));
          }}
        >
          <desc id={`${id}-desc`}>
            {`Fictional pressure history over ${points.length} weekly sessions. Latest right eye ${latest.od.iop ?? 'no accepted reading'}, left eye ${latest.os.iop ?? 'no accepted reading'} mmHg. Use the left and right arrow keys to read each session.`}
          </desc>
          {ticks.map((v) => (
            <g key={v}>
              <line className="gridl" x1={L} x2={R} y1={y(v)} y2={y(v)} />
              <text className="tick" x={L - 10} y={y(v) + 5} textAnchor="end">{v}</text>
            </g>
          ))}
          <text className="tick" x={L - 10} y={T - 8} textAnchor="end">mmHg</text>
          {band(xs, points.map((p) => p.od.iop), points.map((p) => p.od.halfWidth), y).map((pts) => (
            <polygon key={`a${pts}`} points={pts} className="band-od" />
          ))}
          {band(xs, points.map((p) => p.os.iop), points.map((p) => p.os.halfWidth), y).map((pts) => (
            <polygon key={`b${pts}`} points={pts} className="band-os" />
          ))}
          {segments(xs, od).map((d) => <path key={`c${d}`} d={d} className="line-od" />)}
          {segments(xs, os).map((d) => <path key={`d${d}`} d={d} className="line-os" />)}
          {points.map((p, i) => (
            <g key={p.id}>
              {od[i] !== null && <circle cx={xs[i]} cy={od[i] as number} r={hover === i ? 6 : 4} className="dot-od" />}
              {os[i] !== null && <circle cx={xs[i]} cy={os[i] as number} r={hover === i ? 6 : 4} className="dot-os" />}
              {p.od.rejected + p.os.rejected > 0 && (
                <rect
                  x={xs[i] - 5}
                  y={H - 26 - ((p.od.rejected + p.os.rejected) / maxRej) * 22}
                  width="10"
                  height={((p.od.rejected + p.os.rejected) / maxRej) * 22}
                  rx="2"
                  className="rej-bar"
                />
              )}
              {(i % 2 === 0 || i === points.length - 1) && (
                <text className="tick" x={xs[i]} y={H - 4} textAnchor="middle">{p.label}</text>
              )}
            </g>
          ))}
          <line className="ax0" x1={L} x2={R} y1={H - 26} y2={H - 26} />
          {hover !== null && <line className="hover-line" x1={xs[hover]} x2={xs[hover]} y1={T} y2={H - 26} />}
        </svg>
        {h && hover !== null && (
          <div className="trend-tip" style={{ left: `${(xs[hover] / W) * 100}%` }} role="status">
            <b>{new Date(h.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</b>
            <span className="tip-od">OD {h.od.iop === null ? 'no accepted reading' : `${h.od.iop} ± ${h.od.halfWidth}`}</span>
            <span className="tip-os">OS {h.os.iop === null ? 'no accepted reading' : `${h.os.iop} ± ${h.os.halfWidth}`}</span>
            <span className="tip-rej">{h.od.rejected + h.os.rejected} rejected · {h.od.accepted + h.os.accepted} accepted</span>
            <DeliveryChip state={h.state} />
          </div>
        )}
      </div>
      <details className="trend-table">
        <summary>Show as a table</summary>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Session</th><th>OD (mmHg)</th><th>OS (mmHg)</th><th>Rejected</th><th>State</th></tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id}>
                  <td>{p.label}</td>
                  <td>{p.od.iop === null ? '—' : `${p.od.iop} ± ${p.od.halfWidth}`}</td>
                  <td>{p.os.iop === null ? '—' : `${p.os.iop} ± ${p.os.halfWidth}`}</td>
                  <td>{p.od.rejected + p.os.rejected}</td>
                  <td><DeliveryChip state={p.state} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
};

export const Sparkline: React.FC<{ values: (number | null)[]; tone?: 'od' | 'os' }> = ({ values, tone = 'od' }) => {
  const nums = values.filter((v): v is number => v !== null);
  if (!nums.length) return null;
  const lo = Math.min(...nums) - 1;
  const hi = Math.max(...nums) + 1;
  const xs = values.map((_, i) => 4 + (i / Math.max(1, values.length - 1)) * 152);
  const ys = values.map((v) => (v === null ? null : 36 - ((v - lo) / (hi - lo)) * 32));
  const lastI = ys.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop() ?? 0;
  return (
    <svg className={`spark spark-${tone}`} viewBox="0 0 160 40" aria-hidden="true">
      {segments(xs, ys).map((d) => <path key={d} d={d} />)}
      <circle cx={xs[lastI]} cy={ys[lastI] as number} r="3.5" />
    </svg>
  );
};

export default IOPTrendChart;
