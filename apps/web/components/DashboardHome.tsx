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
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-800">Error</h2>
            <p className="text-airton-gray mt-2">Invalid user role detected. Please contact support.</p>
        </div>
      );
  }
};

export default DashboardHome;
