
import type { Patient, Clinic } from '../types';

const generateIOPHistory = (numReadings: number): Patient['iopHistory'] => {
  const history = [];
  const today = new Date();
  for (let i = 0; i < numReadings; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (numReadings - i -1) * 7);
    history.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      leftEye: Math.floor(Math.random() * (25 - 10 + 1) + 10),
      rightEye: Math.floor(Math.random() * (25 - 10 + 1) + 10),
      time: `${Math.floor(Math.random() * 12) + 1}:00 ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
    });
  }
  return history;
};

const mockPatient: Patient = {
  id: 'pat_123',
  name: 'Jane Doe',
  age: 68,
  lastCheckup: '2023-10-15',
  doctor: 'Dr. Emily Carter',
  iopHistory: generateIOPHistory(12),
  avatarUrl: 'https://picsum.photos/seed/janedoe/200',
  riskLevel: 'Medium',
};

const mockDoctorPatients: Omit<Patient, 'iopHistory'>[] = [
    { id: 'pat_123', name: 'Jane Doe', age: 68, lastCheckup: '2023-10-15', doctor: 'Dr. Emily Carter', avatarUrl: 'https://picsum.photos/seed/janedoe/200', riskLevel: 'Medium' },
    { id: 'pat_124', name: 'John Smith', age: 72, lastCheckup: '2023-11-01', doctor: 'Dr. Emily Carter', avatarUrl: 'https://picsum.photos/seed/johnsmith/200', riskLevel: 'High' },
    { id: 'pat_125', name: 'Maria Garcia', age: 65, lastCheckup: '2023-09-20', doctor: 'Dr. Emily Carter', avatarUrl: 'https://picsum.photos/seed/mariagarcia/200', riskLevel: 'Low' },
];

const mockAdminClinics: Clinic[] = [
    { id: 'cli_001', name: 'City General Hospital', patients: 125, subscription: 'Enterprise' },
    { id: 'cli_002', name: 'VisionCare Specialists', patients: 78, subscription: 'Pro' },
    { id: 'cli_003', name: 'BrightEyes Clinic', patients: 45, subscription: 'Pro' },
    { id: 'cli_004', name: 'Community Health Center', patients: 210, subscription: 'Basic' },
];

export const getPatientData = (patientId: string): Promise<Patient> => {
  console.log(`Fetching data for patient: ${patientId}`);
  return new Promise(resolve => setTimeout(() => resolve(mockPatient), 500));
};

export const getDoctorData = (doctorId: string): Promise<Omit<Patient, 'iopHistory'>[]> => {
    console.log(`Fetching patients for doctor: ${doctorId}`);
    return new Promise(resolve => setTimeout(() => resolve(mockDoctorPatients), 500));
};

export const getAdminData = (): Promise<{clinics: Clinic[], totalPatients: number, mrr: number}> => {
    console.log(`Fetching admin data`);
    const totalPatients = mockAdminClinics.reduce((sum, clinic) => sum + clinic.patients, 0);
    const mrr = 12500; // Mock monthly recurring revenue
    return new Promise(resolve => setTimeout(() => resolve({clinics: mockAdminClinics, totalPatients, mrr }), 500));
};
