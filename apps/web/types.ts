
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

export interface IOPReading {
  date: string;
  leftEye: number;
  rightEye: number;
  time: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  lastCheckup: string;
  doctor: string;
  iopHistory: IOPReading[];
  avatarUrl: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface Clinic {
    id: string;
    name: string;
    patients: number;
    subscription: 'Basic' | 'Pro' | 'Enterprise';
}
