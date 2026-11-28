import React from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import AdminDashboard from './AdminDashboard';

interface DashboardHomeProps {
  user: User;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  switch (user.role) {
    case UserRole.Patient:
      return <PatientDashboard user={user} />;
    case UserRole.Doctor:
      return <DoctorDashboard user={user} />;
    case UserRole.Admin:
      return <AdminDashboard user={user} />;
    default:
      return (
        <div className="glass card">
          <h2 className="h3">Unknown role</h2>
          <p className="body">This demonstration only has patient, doctor and admin views. Log out and choose one of them.</p>
        </div>
      );
  }
};

export default DashboardHome;
