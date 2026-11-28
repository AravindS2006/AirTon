import React from 'react';
import { Link } from 'react-router-dom';
import { EvidenceLadder, Logo } from './ui/Primitives';

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="wrap footer-grid">
      <div className="footer-brand">
        <Logo size={34} />
        <p>Developing home eye-pressure monitoring under a doctor&apos;s care.</p>
        <EvidenceLadder lit={['supplied', 'proposed', 'synthetic']} />
      </div>
      <nav aria-label="Project">
        <h2 className="eyebrow">Project</h2>
        <ul>
          <li><Link to="/about">About AirTon</Link></li>
          <li><Link to="/blog">Research resources</Link></li>
          <li><Link to="/login">Dashboards demo</Link></li>
        </ul>
      </nav>
      <nav aria-label="Support">
        <h2 className="eyebrow">Support</h2>
        <ul>
          <li><Link to="/faq">FAQ</Link></li>
          <li><Link to="/privacy-policy">Privacy information</Link></li>
        </ul>
      </nav>
      <div>
        <h2 className="eyebrow">Status</h2>
        <p className="footer-note">
          Concept and research stage. No device, clinical service or patient data is connected to this interface. All readings and figures are fictional.
        </p>
      </div>
    </div>
    <div className="wrap footer-base">
      <span>AirTon project interface demonstration · {new Date().getFullYear()}</span>
      <span className="mono">Fonts, icons and styles are bundled locally</span>
    </div>
  </footer>
);

export default Footer;
