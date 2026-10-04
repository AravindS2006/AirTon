import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
      <div className="space-y-8">
        {/* Email Notifications */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Email Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="news-updates" className="text-gray-600">News & Updates</label>
              <input type="checkbox" id="news-updates" className="h-4 w-4 rounded text-airton-blue focus:ring-airton-blue" defaultChecked/>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="reading-reminders" className="text-gray-600">IOP Reading Reminders</label>
              <input type="checkbox" id="reading-reminders" className="h-4 w-4 rounded text-airton-blue focus:ring-airton-blue" defaultChecked/>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="appointment-reminders" className="text-gray-600">Appointment Reminders</label>
              <input type="checkbox" id="appointment-reminders" className="h-4 w-4 rounded text-airton-blue focus:ring-airton-blue"/>
            </div>
          </div>
        </div>
        {/* Data Management */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Data Management</h3>
          <p className="text-sm text-airton-gray mb-4">Manage your personal data and account.</p>
          <div className="flex space-x-4">
              <button type="button" className="bg-gray-200 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm">Export My Data</button>
              <button type="button" className="bg-red-100 text-red-700 font-semibold px-5 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
