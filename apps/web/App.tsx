import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import type { User } from './types';
import { prefersReducedMotion, useIris } from './components/immersive/Iris';
import type { IrisSpec } from './components/immersive/Iris';

// Page components
import LandingPage from './components/LandingPage';
import AboutUs from './components/AboutUs';
import Blog from './components/Blog';
import FAQ from './components/FAQ';
import PrivacyPolicy from './components/PrivacyPolicy';
import ResearchDemo from './components/ResearchDemo';
import NotFound from './components/NotFound';
import Login from './components/Login';

// Dashboard components
import Dashboard from './components/Dashboard';
import DashboardHome from './components/DashboardHome';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import Header from './components/Header';
import Footer from './components/Footer';

/** Where the background iris sits for each route. The landing page steers it per scroll scene. */
function routeIris(path: string): IrisSpec {
  if (path.startsWith('/dashboard')) return { d: { x: 1.06, y: 0.14, r: 0.42, i: 0.26 }, m: { x: 1.12, y: 0.04, r: 0.5, i: 0.18 } };
  if (path.startsWith('/login')) return { d: { x: 0.72, y: 0.52, r: 0.4, i: 1, p: 0.28, fix: 1 }, m: { x: 0.5, y: 0.2, r: 0.42, i: 0.55, fix: 1 } };
  if (path === '/') return { d: { x: 0.74, y: 0.55, r: 0.4, i: 1, p: 0.3, fix: 1 }, m: { x: 0.5, y: 0.34, r: 0.5, i: 0.5, fix: 1 } };
  if (path === '/demo') return { d: { x: 1.05, y: 0.18, r: 0.42, i: 0.35 }, m: { x: 1.15, y: 0.08, r: 0.5, i: 0.22 } };
  if (path === '/about') return { d: { x: 0.92, y: 0.3, r: 0.42, i: 0.5 }, m: { x: 1.05, y: 0.1, r: 0.5, i: 0.3 } };
  if (path === '/blog') return { d: { x: 0.08, y: 0.92, r: 0.45, i: 0.42 }, m: { x: -0.1, y: 1, r: 0.5, i: 0.3 } };
  if (path === '/faq') return { d: { x: 0.94, y: 0.82, r: 0.4, i: 0.45 }, m: { x: 1.1, y: 0.95, r: 0.5, i: 0.3 } };
  if (path === '/privacy-policy') return { d: { x: 1.04, y: 0.5, r: 0.5, i: 0.3 }, m: { x: 1.2, y: 0.5, r: 0.5, i: 0.2 } };
  return { d: { x: 0.5, y: 0.56, r: 0.34, i: 0.6, p: 0.62 }, m: { x: 0.5, y: 0.7, r: 0.45, i: 0.4, p: 0.62 } };
}

type Lids = 'open' | 'closing' | 'opening';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const iris = useIris();
  const [display, setDisplay] = useState<Location>(location);
  const [lids, setLids] = useState<Lids>('open');
  const chromeRef = useRef<HTMLDivElement>(null);

  // A blink hides each page change; switching tabs inside the dashboard only refocuses.
  useEffect(() => {
    if (location.pathname === display.pathname) {
      if (location !== display) setDisplay(location);
      return undefined;
    }
    const inDash = location.pathname.startsWith('/dashboard') && display.pathname.startsWith('/dashboard');
    if (inDash || prefersReducedMotion()) {
      setDisplay(location);
      window.scrollTo(0, 0);
      return undefined;
    }
    setLids('closing');
    const t1 = window.setTimeout(() => {
      setDisplay(location);
      window.scrollTo(0, 0);
      iris.pulse(0.6);
      setLids('opening');
    }, 300);
    const t2 = window.setTimeout(() => setLids('open'), 880);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    iris.setTarget(routeIris(display.pathname));
  }, [display.pathname, iris]);

  // Keep sticky elements below the demonstration notice, whatever its wrapped height.
  useLayoutEffect(() => {
    const el = chromeRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const set = () => {
      const notice = el.querySelector('.notice') as HTMLElement | null;
      document.documentElement.style.setProperty('--notice-h', `${notice?.offsetHeight ?? 0}px`);
      document.documentElement.style.setProperty('--chrome-h', `${el.offsetHeight}px`);
    };
    const ro = new ResizeObserver(set);
    ro.observe(el);
    set();
    return () => ro.disconnect();
  }, []);

  const path = display.pathname;
  const isDash = path.startsWith('/dashboard');
  const showHeaderAndFooter = !path.startsWith('/login') && !isDash;

  return (
    <div className="app">
      <button type="button" className="skip" onClick={() => document.getElementById('main')?.focus()}>
        Skip to content
      </button>
      <div className="chrome" ref={chromeRef}>
        <div role="status" className="notice">
          AirTon interface demonstration. All readings, patient profiles and business figures are fictional. Home IOP monitoring under a doctor&apos;s care is the intended
          first product; this app is not connected to a device or a clinical service.
        </div>
        {showHeaderAndFooter && <Header />}
      </div>
      <main id="main" tabIndex={-1} className={isDash ? 'main main-dash' : 'main'}>
        <Routes location={display}>
          {/* Public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/demo" element={<ResearchDemo />} />

          {/* Simulated login */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={setUser} />} />

          {/* Dashboard pages (simulated role) */}
          <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}>
            <Route index element={user ? <DashboardHome user={user} /> : <Navigate to="/login" />} />
            <Route path="profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showHeaderAndFooter && <Footer />}
      <div className="lid lid-top" data-state={lids} aria-hidden="true" />
      <div className="lid lid-bot" data-state={lids} aria-hidden="true" />
    </div>
  );
}

export default App;
