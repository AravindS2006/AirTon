import React, { useState } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { Icon, Logo } from './ui/Primitives';
import { useIris } from './immersive/Iris';

interface LoginProps {
  onLogin: (user: User) => void;
}

const mockUsers: Record<UserRole, User> = {
  [UserRole.Patient]: { id: 'pat_123', name: 'Jane Doe', email: 'jane.doe@email.com', role: UserRole.Patient },
  [UserRole.Doctor]: { id: 'doc_456', name: 'Dr. Emily Carter', email: 'emily.carter@clinic.com', role: UserRole.Doctor },
  [UserRole.Admin]: { id: 'adm_789', name: 'Admin User', email: 'admin@airton.com', role: UserRole.Admin },
};

const ROLES: { role: UserRole; icon: string; text: string }[] = [
  { role: UserRole.Patient, icon: 'eye', text: 'Per-eye readings, rejected attempts, delivery state and a simulated session.' },
  { role: UserRole.Doctor, icon: 'user', text: 'Assigned patients, review states and each patient’s pressure history.' },
  { role: UserRole.Admin, icon: 'clinic', text: 'Clinics, enrolment and device service figures.' },
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Patient);
  const iris = useIris();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    iris.pulse(1);
    onLogin(mockUsers[selectedRole]);
  };

  return (
    <div className="login">
      <div className="wrap login-grid">
        <form className="glass login-card" onSubmit={handleLogin}>
          <Logo size={36} />
          <div>
            <h1 className="display display-sm">Choose a <em>demonstration role</em></h1>
            <p className="body">Select a role to view the dashboard.</p>
          </div>
          <fieldset className="roles">
            <legend className="eyebrow">Select role</legend>
            {ROLES.map((r) => (
              <label key={r.role} className={`role ${selectedRole === r.role ? 'on' : ''}`} htmlFor={`role-${r.role}`}>
                <input
                  type="radio"
                  id={`role-${r.role}`}
                  name="role"
                  value={r.role}
                  checked={selectedRole === r.role}
                  onChange={() => setSelectedRole(r.role)}
                />
                <span className="role-icon">
                  <Icon name={r.icon} size={24} />
                </span>
                <span className="role-text">
                  <b>{r.role}</b>
                  <span>{r.text}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="src">This is a simulated login for demonstration purposes. In a real application, you would enter your email and password.</p>
          <button type="submit" className="btn btn-block">
            Login as {selectedRole} <Icon name="arrow" size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
