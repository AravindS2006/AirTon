/**
 * Fictional demonstration data. Nothing here comes from a device, a patient or a
 * clinical service. Values are generated from a fixed seed so every visit shows the
 * same fictional history. Rejected attempts carry reasons and no value, matching the
 * repository's measurement contract.
 */
import type { Attempt, Clinic, Eye, Patient, PatientSummary, ReviewState, Session, SessionPoint } from '../types';
import type { Reason } from '../lib/simulator';
import { rng } from '../lib/simulator';

const REJECT_REASONS: Reason[] = ['alignment', 'alignment', 'blink', 'blink', 'signal_quality', 'out_of_domain', 'estimate_uncertain'];
const DAY = 86_400_000;

function buildSessions(seed: number, base: { OD: number; OS: number }, weeks = 12): Session[] {
  const { u, g } = rng(seed);
  const today = new Date();
  today.setHours(8, 30, 0, 0);
  const sessions: Session[] = [];
  for (let w = 0; w < weeks; w++) {
    const date = new Date(today.getTime() - (weeks - 1 - w) * 7 * DAY);
    const attempts: Attempt[] = [];
    (['OD', 'OS'] as Eye[]).forEach((eye) => {
      const level = base[eye] + 1.2 * Math.sin((w + (eye === 'OD' ? 0 : 1.7)) / 2.2) + 0.8 * g();
      for (let k = 0; k < 3; k++) {
        const at = new Date(date.getTime() + (eye === 'OD' ? 0 : 6) * 60_000 + k * 120_000).toISOString();
        const reject = u() < 0.24;
        if (reject) {
          const reason = REJECT_REASONS[Math.floor(u() * REJECT_REASONS.length)];
          attempts.push({ id: `demo-${seed}-${w}-${eye}-${k}`, eye, at, status: 'reject', iop: null, halfWidth: null, reasons: [reason] });
        } else {
          attempts.push({
            id: `demo-${seed}-${w}-${eye}-${k}`,
            eye,
            at,
            status: 'pass',
            iop: Math.round((level + 0.9 * g()) * 10) / 10,
            halfWidth: Math.round((3 + 1.2 * u()) * 10) / 10,
            reasons: [],
          });
        }
      }
    });
    const state = w === weeks - 1 ? 'delivered' : 'reviewed';
    sessions.push({ id: `demo-session-${seed}-${w}`, date: date.toISOString(), attempts, state });
  }
  return sessions;
}

function summarise(sessions: Session[]): SessionPoint[] {
  return sessions.map((s) => {
    const eye = (e: Eye) => {
      const acc = s.attempts.filter((a) => a.eye === e && a.status === 'pass');
      const rej = s.attempts.filter((a) => a.eye === e && a.status === 'reject').length;
      const mean = acc.length ? acc.reduce((t, a) => t + (a.iop as number), 0) / acc.length : null;
      const hw = acc.length ? acc.reduce((t, a) => t + (a.halfWidth as number), 0) / acc.length : null;
      return {
        iop: mean === null ? null : Math.round(mean * 10) / 10,
        halfWidth: hw === null ? null : Math.round(hw * 10) / 10,
        accepted: acc.length,
        rejected: rej,
      };
    };
    const d = new Date(s.date);
    return {
      id: s.id,
      date: s.date,
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      od: eye('OD'),
      os: eye('OS'),
      state: s.state,
    };
  });
}

interface Seeded {
  id: string;
  name: string;
  age: number;
  seed: number;
  base: { OD: number; OS: number };
  reviewState: ReviewState;
}

const DOCTOR = 'Dr. Emily Carter';
const PEOPLE: Seeded[] = [
  { id: 'pat_123', name: 'Jane Doe', age: 68, seed: 123, base: { OD: 17.2, OS: 18.4 }, reviewState: 'awaiting' },
  { id: 'pat_124', name: 'John Smith', age: 72, seed: 124, base: { OD: 21.5, OS: 20.1 }, reviewState: 'reviewed' },
  { id: 'pat_125', name: 'Maria Garcia', age: 65, seed: 125, base: { OD: 14.8, OS: 15.6 }, reviewState: 'missed' },
];

function buildPatient(p: Seeded): Patient {
  let sessions = buildSessions(p.seed, p.base);
  if (p.reviewState === 'missed') sessions = sessions.slice(0, sessions.length - 2);
  if (p.reviewState === 'reviewed') sessions = sessions.map((s) => ({ ...s, state: 'reviewed' }));
  return { id: p.id, name: p.name, age: p.age, doctor: DOCTOR, reviewState: p.reviewState, sessions, points: summarise(sessions) };
}

const PATIENTS = PEOPLE.map(buildPatient);

const mockAdminClinics: Clinic[] = [
  { id: 'cli_001', name: 'City General Hospital', patients: 125, subscription: 'Enterprise' },
  { id: 'cli_002', name: 'VisionCare Specialists', patients: 78, subscription: 'Pro' },
  { id: 'cli_003', name: 'BrightEyes Clinic', patients: 45, subscription: 'Pro' },
  { id: 'cli_004', name: 'Community Health Center', patients: 210, subscription: 'Basic' },
];

const delay = <T,>(value: T, ms = 380) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

export const getPatientData = (patientId: string): Promise<Patient> =>
  delay(PATIENTS.find((p) => p.id === patientId) ?? PATIENTS[0]);

export const getDoctorData = (_doctorId: string): Promise<PatientSummary[]> =>
  delay(
    PATIENTS.map((p) => {
      const last = p.points[p.points.length - 1];
      const since = Date.now() - 28 * DAY;
      const rejectedRecent = p.sessions
        .filter((s) => new Date(s.date).getTime() >= since)
        .reduce((t, s) => t + s.attempts.filter((a) => a.status === 'reject').length, 0);
      return {
        id: p.id,
        name: p.name,
        age: p.age,
        doctor: p.doctor,
        reviewState: p.reviewState,
        lastSession: last.date,
        latest: { od: last.od.iop, os: last.os.iop },
        rejectedRecent,
      };
    }),
  );

export interface AdminData {
  clinics: Clinic[];
  totalPatients: number;
  mrr: number;
  devices: { inService: number; calibrationDue: number; quarantined: number };
}

export const getAdminData = (): Promise<AdminData> => {
  const totalPatients = mockAdminClinics.reduce((sum, clinic) => sum + clinic.patients, 0);
  return delay({ clinics: mockAdminClinics, totalPatients, mrr: 12500, devices: { inService: 412, calibrationDue: 23, quarantined: 4 } });
};
