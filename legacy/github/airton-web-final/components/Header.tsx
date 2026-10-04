import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
           <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-airton-blue">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
                <circle cx="16" cy="16" r="8" fill="currentColor"/>
                <path d="M16 4.5C19.8333 9.33333 24.3 12.5 30 14" stroke="#00A89D" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          <span className="text-2xl font-bold text-airton-blue-dark">AirTon</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/about" className="text-gray-600 hover:text-airton-blue transition-colors">About Us</Link>
          <a href="/#technology" className="text-gray-600 hover:text-airton-blue transition-colors">Technology</a>
          <Link to="/blog" className="text-gray-600 hover:text-airton-blue transition-colors">Blog</Link>
          <a href="/#contact" className="text-gray-600 hover:text-airton-blue transition-colors">Contact</a>
        </nav>
        <Link to="/login" className="hidden md:block bg-airton-blue text-white font-semibold px-6 py-2 rounded-lg hover:bg-airton-blue-dark transition-colors shadow-sm hover:shadow-md">
          Login
        </Link>
        <button type="button" className="md:hidden text-gray-700">
            <i data-lucide="menu"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;