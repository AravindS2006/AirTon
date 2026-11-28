import type { Reason } from './lib/simulator';

export enum UserRole {
  Patient = 'Patient',
  Doctor = 'Doctor',
  Admin = 'Admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** OD = right eye, OS = left eye. Eyes are always kept separate. */
export type Eye = 'OD' | 'OS';

/** Saved on the device, delivered to the server, reviewed by a clinician (R22). */
export type DeliveryState = 'saved' | 'delivered' | 'reviewed';

/** Review state of a patient's recent readings. Not a disease risk label (R01). */
export type ReviewState = 'awaiting' | 'reviewed' | 'missed';

export interface Attempt {
  id: string;
  eye: Eye;
  at: string;
  status: 'pass' | 'reject';
  /** Fictional pressure value; always null for a rejected attempt (R03). */
  iop: number | null;
  /** Fictional half-width of the uncertainty interval, mmHg (R25). */
  halfWidth: number | null;
  reasons: Reason[];
}

export interface Session {
  id: string;
  date: string;
  attempts: Attempt[];
  state: DeliveryState;
}

export interface EyeSummary {
  iop: number | null;
  halfWidth: number | null;
  accepted: number;
  rejected: number;
}

export interface SessionPoint {
  id: string;
  date: string;
  label: string;
  od: EyeSummary;
  os: EyeSummary;
  state: DeliveryState;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  doctor: string;
  reviewState: ReviewState;
  sessions: Session[];
  points: SessionPoint[];
}

export type PatientSummary = Omit<Patient, 'sessions' | 'points'> & {
  lastSession: string;
  latest: { od: number | null; os: number | null };
  /** Rejected attempts in the last four weeks. */
  rejectedRecent: number;
};

export interface Clinic {
  id: string;
  name: string;
  patients: number;
  subscription: 'Basic' | 'Pro' | 'Enterprise';
}
