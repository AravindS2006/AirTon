import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { User } from './types';

// Page Components
import LandingPage from './components/LandingPage';
import AboutUs from './components/AboutUs';
import Blog from './components/Blog';
import FAQ from './components/FAQ';
import PrivacyPolicy from './components/PrivacyPolicy';
import NotFound from './components/NotFound';
import Login from './components/Login';

// Dashboard Components
import Dashboard from './components/Dashboard';
import DashboardHome from './components/DashboardHome';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const showHeaderAndFooter = !location.pathname.startsWith('/login') && !location.pathname.startsWith('/dashboard');

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
      {showHeaderAndFooter && <Header />}
      <main className="flex-grow">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Auth Pages */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
          
          {/* Dashboard Pages (Protected) */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          >
            <Route index element={user ? <DashboardHome user={user} /> : <Navigate to="/login" />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Not Found Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showHeaderAndFooter && <Footer />}
    </div>
  );
}

export default App;