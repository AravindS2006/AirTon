import React, { useEffect, useMemo, useState } from 'react';
import { getPatientData } from '../services/mockApiService';
import type { DeliveryState, Eye, Patient, SessionPoint, User } from '../types';
import { REASON_TEXT } from '../lib/simulator';
import IOPTrendChart, { Sparkline } from './IOPTrendChart';
import SimulatedSession from './SimulatedSession';
import { DeliveryChip, FictionalBadge, Icon, Monogram } from './ui/Primitives';

interface PatientDashboardProps {
  user: User;
}

const DAY = 86_400_000;
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const Skeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="skeleton" role="status" aria-label="Loading fictional data">
    {Array.from({ length: rows }).map((_, i) => (
      <span key={i} />
    ))}
  </div>
);

function latestAccepted(points: SessionPoint[], eye: Eye) {
  for (let i = points.length - 1; i >= 0; i--) {
    const e = eye === 'OD' ? points[i].od : points[i].os;
    if (e.iop !== null) return { ...e, date: points[i].date };
  }
  return null;
}

const STATES: DeliveryState[] = ['saved', 'delivered', 'reviewed'];

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user }) => {
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    let live = true;
    getPatientData(user.id).then((data) => live && setPatient(data));
    return () => {
      live = false;
    };
  }, [user.id]);

  const recent = useMemo(() => (patient ? patient.sessions.slice(-2).reverse() : []), [patient]);
  if (!patient) return <Skeleton rows={4} />;

  const last = patient.points[patient.points.length - 1];
  const eyes: { eye: Eye; label: string; tone: 'od' | 'os' }[] = [
    { eye: 'OD', label: 'Right eye · OD', tone: 'od' },
    { eye: 'OS', label: 'Left eye · OS', tone: 'os' },
  ];
  const appointments = [
    { title: `Follow-up with ${patient.doctor}`, date: new Date(Date.now() + 6 * DAY) },
    { title: 'Device service and calibration check', date: new Date(Date.now() + 41 * DAY) },
  ];

  return (
    <div className="dash-stack">
      <div className="dash-banner">
        <FictionalBadge />
        <span>Your doctor interprets these readings. AirTon does not diagnose glaucoma, set alert thresholds or change treatment.</span>
      </div>

      <section className="grid-eyes" aria-label="Latest readings">
        {eyes.map(({ eye, label, tone }) => {
          const a = latestAccepted(patient.points, eye);
          const sess = eye === 'OD' ? last.od : last.os;
          return (
            <article key={eye} className={`glass eye-card tone-${tone}`}>
              <span className="eyebrow">{label}</span>
              {a ? (
                <p className="eye-value">
                  <span className="num">{a.iop?.toFixed(1)}</span>
                  <span className="eye-unit">± {a.halfWidth} mmHg</span>
                </p>
              ) : (
                <p className="eye-value muted">No accepted reading</p>
              )}
              <Sparkline values={patient.points.map((p) => (eye === 'OD' ? p.od.iop : p.os.iop))} tone={tone} />
              <p className="eye-meta">
                {a ? `Latest accepted ${new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''} · last session {sess.accepted} accepted, {sess.rejected} rejected
              </p>
            </article>
          );
        })}
        <article className="glass session-card">
          <span className="eyebrow">Latest session · {new Date(last.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          <ol className="pipeline-states" aria-label="Delivery state">
            {STATES.map((s) => (
              <li key={s} className={STATES.indexOf(s) <= STATES.indexOf(last.state) ? 'done' : ''} aria-current={s === last.state ? 'step' : undefined}>
                <DeliveryChip state={s} />
              </li>
            ))}
          </ol>
          <p className="body">Readings are reviewed by your care team on their schedule. Uploading does not mean a doctor has seen them yet.</p>
        </article>
      </section>

      <section className="glass pad">
        <IOPTrendChart points={patient.points} title="Your pressure history · 12 weekly sessions" />
      </section>

      <section className="grid-2">
        <div className="glass pad">
          <span className="eyebrow">Recent attempts</span>
          <ul className="attempts">
            {recent.flatMap((s) =>
              s.attempts.map((a) => (
                <li key={a.id} className={a.status}>
                  <span className={`eye-tag ${a.eye === 'OD' ? 'od' : 'os'}`}>{a.eye}</span>
                  <span className="attempt-time">{when(a.at)}</span>
                  {a.status === 'pass' ? (
                    <span className="attempt-val">
                      {a.iop?.toFixed(1)} <small>± {a.halfWidth} mmHg</small>
                    </span>
                  ) : (
                    <span className="attempt-rej">
                      <Icon name="x" size={14} /> {a.reasons.map((r) => REASON_TEXT[r]).join(', ')} · no value
                    </span>
                  )}
                </li>
              )),
            )}
          </ul>
        </div>
        <SimulatedSession eye="OD" />
      </section>

      <section className="grid-2">
        <div className="glass pad care">
          <span className="eyebrow">My care team</span>
          <div className="care-row">
            <Monogram name={patient.doctor} size={64} tone="fluor" />
            <div>
              <p className="h4">{patient.doctor}</p>
              <p className="body">Ophthalmologist · reviews your readings and sets your monitoring plan</p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" disabled title="Messaging is not available in this demonstration">
            <Icon name="message" size={16} /> Message (not in demo)
          </button>
        </div>
        <div className="glass pad">
          <span className="eyebrow">Upcoming</span>
          <ul className="appts">
            {appointments.map((a) => (
              <li key={a.title}>
                <span className="appt-date">
                  <b>{a.date.toLocaleDateString('en-GB', { day: 'numeric' })}</b>
                  <span>{a.date.toLocaleDateString('en-GB', { month: 'short' })}</span>
                </span>
                <span>
                  <b>{a.title}</b>
                  <span className="muted">{a.date.toLocaleDateString('en-GB', { weekday: 'long' })} · 10:30</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default PatientDashboard;
