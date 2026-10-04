import React, { useState, useEffect } from 'react';
import type { User, Clinic } from '../types';
import { getAdminData } from '../services/mockApiService';

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [adminData, setAdminData] = useState<{clinics: Clinic[], totalPatients: number, mrr: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getAdminData();
      setAdminData(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !adminData) {
    return <div className="text-center p-10">Loading admin data...</div>;
  }
  
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
                <div>
                    <p className="text-sm text-airton-gray">Total Patients</p>
                    <p className="text-3xl font-bold text-airton-blue-dark">{adminData.totalPatients.toLocaleString()}</p>
                </div>
                <i data-lucide="users" className="text-airton-blue opacity-50 w-12 h-12"></i>
            </div>
            <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
                <div>
                    <p className="text-sm text-airton-gray">Active Clinics</p>
                    <p className="text-3xl font-bold text-airton-blue-dark">{adminData.clinics.length}</p>
                </div>
                <i data-lucide="hospital" className="text-airton-blue opacity-50 w-12 h-12"></i>
            </div>
            <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
                <div>
                    <p className="text-sm text-airton-gray">MRR</p>
                    <p className="text-3xl font-bold text-airton-teal">${adminData.mrr.toLocaleString()}</p>
                </div>
                <i data-lucide="dollar-sign" className="text-airton-teal opacity-50 w-12 h-12"></i>
            </div>
        </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Clinic Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-sm font-semibold text-gray-600">Clinic Name</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Patients</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Subscription Plan</th>
                <th className="p-3 text-sm font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {adminData.clinics.map((clinic) => (
                <tr key={clinic.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{clinic.name}</td>
                  <td className="p-3 text-gray-600">{clinic.patients}</td>
                  <td className="p-3 text-gray-600">{clinic.subscription}</td>
                  <td className="p-3 text-right">
                    <button type="button" className="text-airton-blue hover:underline text-sm font-medium">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;