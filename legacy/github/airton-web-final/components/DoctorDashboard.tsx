import React, { useState, useEffect } from 'react';
import type { User, Patient } from '../types';
import { getDoctorData } from '../services/mockApiService';

interface DoctorDashboardProps {
  user: User;
}

const RiskBadge: React.FC<{ risk: 'Low' | 'Medium' | 'High' }> = ({ risk }) => {
    const riskClasses = {
        Low: 'bg-green-100 text-green-800',
        Medium: 'bg-yellow-100 text-yellow-800',
        High: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${riskClasses[risk]}`}>{risk} Risk</span>
};


const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user }) => {
  const [patients, setPatients] = useState<Omit<Patient, 'iopHistory'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getDoctorData(user.id);
      setPatients(data);
      setLoading(false);
    };
    fetchData();
  }, [user.id]);

  if (loading) {
    return <div className="text-center p-10">Loading patient list...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Patient Overview</h2>
          <button type="button" className="bg-airton-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-airton-blue-dark flex items-center">
            <i data-lucide="plus" className="mr-2 h-4 w-4"></i> Add Patient
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-sm font-semibold text-gray-600">Patient</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Age</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Last Checkup</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Risk Level</th>
                <th className="p-3 text-sm font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center space-x-3">
                      <img src={patient.avatarUrl} alt={patient.name} className="w-10 h-10 rounded-full" />
                      <span className="font-medium text-gray-800">{patient.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{patient.age}</td>
                  <td className="p-3 text-gray-600">{patient.lastCheckup}</td>
                  <td className="p-3"><RiskBadge risk={patient.riskLevel} /></td>
                  <td className="p-3 text-right">
                    <button type="button" className="text-airton-blue hover:underline text-sm font-medium">View Chart</button>
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

export default DoctorDashboard;