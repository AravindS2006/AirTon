import React, { useEffect, useMemo, useState } from 'react';
import type { Patient, PatientSummary, ReviewState, User } from '../types';
import { getDoctorData, getPatientData } from '../services/mockApiService';
import IOPTrendChart from './IOPTrendChart';
import { Skeleton } from './PatientDashboard';
import { FictionalBadge, Icon, Monogram, ReviewChip } from './ui/Primitives';

interface DoctorDashboardProps {
  user: User;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user }) => {
  const [patients, setPatients] = useState<PatientSummary[] | null>(null);
  const [overrides, setOverrides] = useState<Record<string, ReviewState>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Patient | null>(null);

  useEffect(() => {
    let live = true;
    getDoctorData(user.id).then((data) => {
      if (!live) return;
      setPatients(data);
      setSelected(data[0]?.id ?? null);
    });
    return () => {
      live = false;
    };
  }, [user.id]);

  useEffect(() => {
    if (!selected) return undefined;
    let live = true;
    setDetail(null);
    getPatientData(selected).then((d) => live && setDetail(d));
    return () => {
      live = false;
    };
  }, [selected]);

  const rows = useMemo(() => (patients ?? []).map((p) => ({ ...p, reviewState: overrides[p.id] ?? p.reviewState })), [patients, overrides]);
  if (!patients) return <Skeleton rows={4} />;

  const awaiting = rows.filter((r) => r.reviewState === 'awaiting').length;
  const missed = rows.filter((r) => r.reviewState === 'missed').length;
  const rejected = rows.reduce((t, r) => t + r.rejectedRecent, 0);
  const current = rows.find((r) => r.id === selected) ?? null;

  return (
    <div className="dash-stack">
      <div className="dash-banner">
        <FictionalBadge />
        <span>No alert thresholds are set. Monitoring schedules, thresholds and response times come from each patient&apos;s reviewed care plan.</span>
      </div>

      <section className="tiles" aria-label="Summary">
        <div className="glass tile"><span className="eyebrow">Assigned patients</span><span className="num">{rows.length}</span></div>
        <div className="glass tile"><span className="eyebrow">Awaiting review</span><span className="num c-fluor">{awaiting}</span></div>
        <div className="glass tile"><span className="eyebrow">Missed sessions</span><span className="num c-alarm">{missed}</span></div>
        <div className="glass tile"><span className="eyebrow">Rejected attempts, 4 weeks</span><span className="num c-paper">{rejected}</span></div>
      </section>

      <section className="glass pad">
        <div className="pad-head">
          <span className="eyebrow">Patient overview</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled title="Enrolment is not available in this demonstration">
            <Icon name="plus" size={16} /> Enrol patient (not in demo)
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Last session</th>
                <th>OD</th>
                <th>OS</th>
                <th>Rejected, 4 weeks</th>
                <th>Review</th>
                <th><span className="sr-only">Chart</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className={p.id === selected ? 'selected' : ''}>
                  <td>
                    <span className="who">
                      <Monogram name={p.name} size={36} />
                      <span>
                        <b>{p.name}</b>
                        <small>{p.age} years</small>
                      </span>
                    </span>
                  </td>
                  <td>{new Date(p.lastSession).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                  <td className="mono">{p.latest.od?.toFixed(1) ?? '—'}</td>
                  <td className="mono">{p.latest.os?.toFixed(1) ?? '—'}</td>
                  <td className="mono">{p.rejectedRecent}</td>
                  <td><ReviewChip state={p.reviewState} /></td>
                  <td className="right">
                    <button type="button" className="link-btn" aria-pressed={p.id === selected} onClick={() => setSelected(p.id)}>
                      Open chart <Icon name="arrow" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {current && (
        <section className="glass pad" aria-label={`Chart for ${current.name}`}>
          <div className="pad-head">
            <span className="who">
              <Monogram name={current.name} size={44} tone="fluor" />
              <span>
                <b className="h4">{current.name}</b>
                <small>Fictional patient · {current.age} years</small>
              </span>
            </span>
            <button
              type="button"
              className="btn btn-sm"
              disabled={current.reviewState === 'reviewed'}
              onClick={() => setOverrides({ ...overrides, [current.id]: 'reviewed' })}
            >
              <Icon name="check" size={16} /> {current.reviewState === 'reviewed' ? 'Reviewed' : 'Mark readings reviewed'}
            </button>
          </div>
          {detail ? <IOPTrendChart points={detail.points} title="Pressure history · per eye" /> : <Skeleton rows={2} />}
          <p className="src">Marking a review only changes this browser tab. Amendments in a real service keep the original record with author, time and reason.</p>
        </section>
      )}
    </div>
  );
};

export default DoctorDashboard;
