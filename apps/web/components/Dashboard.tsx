import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { FictionalBadge, Icon, Logo, Monogram } from './ui/Primitives';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/dashboard/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/dashboard/profile', label: 'Profile', icon: 'user' },
  { to: '/dashboard/settings', label: 'Settings', icon: 'settings' },
];

const TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/profile': 'Profile',
  '/dashboard/settings': 'Settings',
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [location.pathname]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="dash">
      <aside className={`rail ${menu ? 'open' : ''}`} id="dash-rail">
        <Link to="/" className="rail-brand" aria-label="AirTon home">
          <Logo />
        </Link>
        <nav aria-label="Dashboard">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="rail-foot">
          <p className="rail-note">
            <FictionalBadge /> Simulated login. Nothing here is connected to a device or a clinic.
          </p>
          <button type="button" className="rail-link logout" onClick={handleLogout}>
            <Icon name="logout" size={20} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
      <div className="dash-body">
        <header className="dash-head">
          <button type="button" className="menu-btn dash-menu" aria-expanded={menu} aria-controls="dash-rail" aria-label={menu ? 'Close navigation' : 'Open navigation'} onClick={() => setMenu(!menu)}>
            <Icon name={menu ? 'x' : 'menu'} size={22} />
          </button>
          <div className="dash-titles">
            <span className="eyebrow">{user.role} view</span>
            <h1 className="dash-title">{TITLES[location.pathname] ?? 'Overview'}</h1>
          </div>
          <div className="dash-user">
            <span className="dash-user-name">
              <b>{user.name}</b>
              <span>{user.email}</span>
            </span>
            <Monogram name={user.name} size={42} tone={user.role === 'Doctor' ? 'fluor' : user.role === 'Admin' ? 'ember' : 'cobalt'} />
          </div>
        </header>
        <div className="dash-main" key={location.pathname}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
