import React from 'react';

const Profile: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">Name</label>
          <p className="text-lg text-gray-800">Jane Doe</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Email</label>
          <p className="text-lg text-gray-800">jane.doe@email.com</p>
        </div>
        <div>
            <button 
                type="button"
                className="bg-airton-blue text-white font-semibold px-5 py-2 rounded-lg hover:bg-airton-blue-dark transition-colors text-sm"
            >
                Edit Profile
            </button>
        </div>
        <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-700">Account Security</h3>
            <button 
                type="button"
                className="mt-2 bg-gray-200 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
                Change Password
            </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
