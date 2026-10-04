import React, { useEffect } from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import type { User } from '../types';

declare global {
  interface Window {
    lucide: {
      createIcons: () => void;
    };
  }
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Rerender lucide icons when the dashboard route changes
    window.lucide.createIcons();
  }, [location.pathname]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'flex items-center p-3 text-airton-blue bg-airton-blue-light rounded-lg font-semibold'
      : 'flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg';

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b flex items-center space-x-2">
           <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-airton-blue">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
                <circle cx="16" cy="16" r="8" fill="currentColor"/>
                <path d="M16 4.5C19.8333 9.33333 24.3 12.5 30 14" stroke="#00A89D" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          <span className="text-2xl font-bold text-airton-blue-dark">AirTon</span>
        </div>
        <nav className="flex-grow p-4 space-y-2">
            <NavLink to="/dashboard" end className={getNavLinkClass}>
                <i data-lucide="layout-dashboard" className="mr-3"></i>Dashboard
            </NavLink>
            <NavLink to="/dashboard/profile" className={getNavLinkClass}>
                <i data-lucide="user" className="mr-3"></i>Profile
            </NavLink>
            <NavLink to="/dashboard/notifications" className={getNavLinkClass}>
                <i data-lucide="bell" className="mr-3"></i>Notifications
            </NavLink>
            <NavLink to="/dashboard/settings" className={getNavLinkClass}>
                <i data-lucide="settings" className="mr-3"></i>Settings
            </NavLink>
        </nav>
        <div className="p-4 border-t">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center p-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg"
            >
                <i data-lucide="log-out" className="mr-3"></i>Logout
            </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">{user.role} Dashboard</h1>
            <div className="flex items-center">
                <span className="text-gray-600 mr-3">Welcome, {user.name}</span>
                <img src={`https://picsum.photos/seed/${user.id}/40`} alt="User Avatar" className="w-10 h-10 rounded-full" />
            </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;