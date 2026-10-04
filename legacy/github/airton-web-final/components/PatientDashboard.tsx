import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { getPatientData } from '../services/mockApiService';
import type { User, Patient } from '../types';

interface PatientDashboardProps {
  user: User;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user }) => {
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getPatientData(user.id);
      setPatientData(data);
      setLoading(false);
    };
    fetchData();
  }, [user.id]);
  
  if (loading || !patientData) {
    return <div className="text-center p-10">Loading patient data...</div>;
  }

  const latestReading = patientData.iopHistory[patientData.iopHistory.length - 1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-airton-gray">Latest IOP (Left)</p>
            <p className="text-3xl font-bold text-airton-blue-dark">{latestReading.leftEye} <span className="text-lg font-normal">mmHg</span></p>
          </div>
          <i data-lucide="eye" className="text-airton-blue opacity-50 w-12 h-12"></i>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-airton-gray">Latest IOP (Right)</p>
            <p className="text-3xl font-bold text-airton-blue-dark">{latestReading.rightEye} <span className="text-lg font-normal">mmHg</span></p>
          </div>
          <i data-lucide="eye" className="text-airton-blue opacity-50 w-12 h-12"></i>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-airton-gray">Risk Level</p>
            <p className={`text-3xl font-bold ${patientData.riskLevel === 'High' ? 'text-red-500' : patientData.riskLevel === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>{patientData.riskLevel}</p>
          </div>
          <i data-lucide="shield-alert" className="text-yellow-500 opacity-50 w-12 h-12"></i>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">IOP History</h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={patientData.iopHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[5, 30]}/>
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leftEye" name="Left Eye" stroke="#00529B" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="rightEye" name="Right Eye" stroke="#00A89D" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
            <ul className="space-y-4">
                <li className="flex items-center justify-between p-3 bg-airton-blue-light rounded-md">
                    <div>
                        <p className="font-semibold text-airton-blue-dark">Follow-up with Dr. Carter</p>
                        <p className="text-sm text-airton-gray">Tuesday, Dec 5, 2023 at 10:30 AM</p>
                    </div>
                    <button type="button" className="text-airton-blue hover:underline text-sm">Details</button>
                </li>
                 <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                        <p className="font-semibold text-gray-700">Annual Eye Exam</p>
                        <p className="text-sm text-airton-gray">Friday, Jan 12, 2024 at 2:00 PM</p>
                    </div>
                    <button type="button" className="text-airton-blue hover:underline text-sm">Details</button>
                </li>
            </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">My Care Team</h3>
            <div className="flex items-center space-x-4">
                <img src="https://picsum.photos/seed/drcarter/80" className="w-20 h-20 rounded-full" alt="Dr. Emily Carter"/>
                <div>
                    <p className="font-bold text-lg text-airton-blue-dark">{patientData.doctor}</p>
                    <p className="text-airton-gray">Ophthalmologist</p>
                    <button type="button" className="mt-2 text-sm bg-airton-teal text-white px-4 py-1 rounded-full hover:opacity-90">Message</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;