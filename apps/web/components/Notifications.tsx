import React from 'react';

const notifications = [
    { id: 1, icon: 'calendar', text: 'Your appointment with Dr. Carter is confirmed for tomorrow at 10:30 AM.', time: '1 day ago', read: false },
    { id: 2, icon: 'trending-up', text: 'Your 7-day IOP average is slightly elevated. Keep monitoring.', time: '3 days ago', read: false },
    { id: 3, icon: 'message-square', text: 'Dr. Carter sent you a new message.', time: '5 days ago', read: true },
    { id: 4, icon: 'check-circle', text: 'Your subscription plan has been successfully renewed.', time: '1 week ago', read: true },
]

const Notifications: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <button type="button" className="text-sm text-airton-blue font-semibold hover:underline">Mark all as read</button>
      </div>
      <ul className="space-y-4">
        {notifications.map(notif => (
            <li key={notif.id} className={`flex items-start space-x-4 p-4 rounded-lg ${!notif.read ? 'bg-airton-blue-light' : ''}`}>
                <div className="mt-1">
                    <i data-lucide={notif.icon} className="text-airton-blue"></i>
                </div>
                <div className="flex-1">
                    <p className="text-gray-800">{notif.text}</p>
                    <p className="text-xs text-airton-gray mt-1">{notif.time}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 bg-airton-blue rounded-full mt-2"></div>}
            </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
