
import React, { useState } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Patient);

  const mockUsers: Record<UserRole, User> = {
    [UserRole.Patient]: { id: 'pat_123', name: 'Jane Doe', email: 'jane.doe@email.com', role: UserRole.Patient },
    [UserRole.Doctor]: { id: 'doc_456', name: 'Dr. Emily Carter', email: 'emily.carter@clinic.com', role: UserRole.Doctor },
    [UserRole.Admin]: { id: 'adm_789', name: 'Admin User', email: 'admin@airton.com', role: UserRole.Admin },
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(mockUsers[selectedRole]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-airton-blue-light">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 m-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-airton-blue-dark">Welcome to AirTon</h1>
          <p className="text-airton-gray mt-2">Select a role to view the dashboard.</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Select Role
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-airton-blue focus:border-airton-blue outline-none"
            >
              <option value={UserRole.Patient}>Patient</option>
              <option value={UserRole.Doctor}>Doctor</option>
              <option value={UserRole.Admin}>Admin</option>
            </select>
          </div>
          <p className="text-xs text-airton-gray text-center mb-6">
            This is a simulated login for demonstration purposes. In a real application, you would enter your email and password.
          </p>
          <button
            type="submit"
            className="w-full bg-airton-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-airton-blue-dark transition-colors duration-300"
          >
            Login as {selectedRole}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;