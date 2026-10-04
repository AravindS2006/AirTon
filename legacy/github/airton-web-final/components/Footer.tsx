import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-airton-blue-dark mb-4">AirTon</h3>
            <p className="text-airton-gray text-sm">Revolutionizing glaucoma screening for a clearer future.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-airton-gray hover:text-airton-blue">About Us</Link></li>
              <li><a href="/#technology" className="text-airton-gray hover:text-airton-blue">Technology</a></li>
              <li><Link to="/blog" className="text-airton-gray hover:text-airton-blue">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#contact" className="text-airton-gray hover:text-airton-blue">Contact Us</a></li>
              <li><Link to="/faq" className="text-airton-gray hover:text-airton-blue">FAQ</Link></li>
              <li><Link to="/privacy-policy" className="text-airton-gray hover:text-airton-blue">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-4">Connect</h4>
            <div className="flex space-x-4 text-airton-gray">
              <a href="#" className="hover:text-airton-blue"><i data-lucide="twitter"></i></a>
              <a href="#" className="hover:text-airton-blue"><i data-lucide="linkedin"></i></a>
              <a href="#" className="hover:text-airton-blue"><i data-lucide="facebook"></i></a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-airton-gray">
          &copy; {new Date().getFullYear()} AirTon Health Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;