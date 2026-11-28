import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon, Logo } from './ui/Primitives';
import { scrollToId } from './LandingPage';
import { ThemeToggle } from './immersive/Theme';

const SECTIONS = [
  { id: 'how', label: 'How it works' },
  { id: 'safety', label: 'Safety' },
  { id: 'evidence', label: 'Evidence' },
];
const PAGES = [
  { to: '/demo', label: 'Research demo' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Resources' },
  { to: '/faq', label: 'FAQ' },
];

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [location.pathname]);

  const goSection = (id: string) => {
    setOpen(false);
    if (location.pathname === '/') scrollToId(id);
    else navigate('/', { state: { section: id } });
  };

  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <Link to="/" className="topbar-brand" aria-label="AirTon home">
          <Logo />
        </Link>
        <nav className={`topbar-nav ${open ? 'open' : ''}`} aria-label="Main" id="main-nav">
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" className="nav-link" onClick={() => goSection(s.id)}>
              {s.label}
            </button>
          ))}
          {PAGES.map((p) => (
            <NavLink key={p.to} to={p.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {p.label}
            </NavLink>
          ))}
          <Link to="/login" className="btn btn-sm nav-cta">
            Explore the demo
          </Link>
        </nav>
        <div className="topbar-tools">
          <ThemeToggle />
        <button type="button" className="menu-btn" aria-expanded={open} aria-controls="main-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          <Icon name={open ? 'x' : 'menu'} size={22} />
        </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
