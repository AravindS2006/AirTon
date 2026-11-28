import React, { useState } from 'react';
import { FictionalBadge, Icon } from './ui/Primitives';

const INITIAL = [
  { id: 1, icon: 'check', text: 'Dr. Carter reviewed the readings from your last session.', time: '1 day ago', read: false },
  { id: 2, icon: 'cloud', text: 'Your latest session was delivered to your care team.', time: '2 days ago', read: false },
  { id: 3, icon: 'x', text: 'One attempt was rejected because of a blink. It was recorded with no value; you can retry within your plan.', time: '2 days ago', read: true },
  { id: 4, icon: 'calendar', text: 'Your appointment with Dr. Carter is confirmed for next week.', time: '5 days ago', read: true },
  { id: 5, icon: 'wrench', text: 'Device calibration check is due in 41 days. The service team will contact you.', time: '1 week ago', read: true },
];

const Notifications: React.FC = () => {
  const [items, setItems] = useState(INITIAL);
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="dash-stack narrow-col">
      <section className="glass pad">
        <div className="pad-head">
          <span className="eyebrow">
            {unread} unread · <FictionalBadge />
          </span>
          <button type="button" className="link-btn" disabled={!unread} onClick={() => setItems(items.map((n) => ({ ...n, read: true })))}>
            Mark all as read
          </button>
        </div>
        <ul className="notes-list">
          {items.map((n) => (
            <li key={n.id} className={n.read ? '' : 'unread'}>
              <span className="note-icon">
                <Icon name={n.icon} size={18} />
              </span>
              <span className="note-body">
                <span>{n.text}</span>
                <small>{n.time}</small>
              </span>
              {!n.read && <i className="note-dot" aria-label="Unread" />}
            </li>
          ))}
        </ul>
        <p className="src">AirTon notifications describe delivery, review and service. They never interpret a pressure value; that stays with the clinician.</p>
      </section>
    </div>
  );
};

export default Notifications;
