import React from 'react';
import { Icon } from './ui/Primitives';

const TOGGLES = [
  { id: 'news-updates', label: 'News and updates', hint: 'Project announcements', on: true },
  { id: 'reading-reminders', label: 'Session reminders', hint: 'Follows the schedule your doctor sets', on: true },
  { id: 'appointment-reminders', label: 'Appointment reminders', hint: 'A day before each visit', on: false },
];

const Settings: React.FC = () => (
  <div className="dash-stack narrow-col">
    <section className="glass pad">
      <span className="eyebrow">Email notifications</span>
      <ul className="switches">
        {TOGGLES.map((t) => (
          <li key={t.id}>
            <label htmlFor={t.id}>
              <span>
                <b>{t.label}</b>
                <small>{t.hint}</small>
              </span>
              <input type="checkbox" role="switch" id={t.id} defaultChecked={t.on} className="switch" />
            </label>
          </li>
        ))}
      </ul>
      <p className="src">These switches only change this page; nothing is sent.</p>
    </section>
    <section className="glass pad">
      <span className="eyebrow">Data management</span>
      <p className="body">Manage your personal data and account. A clinical service would honour export and deletion requests under its reviewed privacy policy.</p>
      <div className="btn-row">
        <button type="button" className="btn btn-ghost btn-sm" disabled title="Not available in this demonstration">
          <Icon name="download" size={16} /> Export my data
        </button>
        <button type="button" className="btn btn-danger btn-sm" disabled title="Not available in this demonstration">
          <Icon name="trash" size={16} /> Delete account
        </button>
      </div>
    </section>
  </div>
);

export default Settings;
