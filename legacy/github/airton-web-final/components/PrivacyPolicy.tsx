import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-airton-blue-dark mb-6">Privacy Policy</h1>
          <div className="prose max-w-none text-airton-gray">
            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6">1. Introduction</h2>
            <p>Welcome to AirTon. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.</p>

            <h2 className="text-xl font-semibold text-gray-800 mt-6">2. Information We Collect</h2>
            <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and services, when you participate in activities on the Services or otherwise when you contact us.</p>
            <p>The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make and the products and features you use. The personal information we collect may include the following: name, email address, health data, and other similar information.</p>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6">3. How We Use Your Information</h2>
            <p>We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>

            <h2 className="text-xl font-semibold text-gray-800 mt-6">4. Will Your Information Be Shared?</h2>
            <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis: Consent, Legitimate Interests, Performance of a Contract, Legal Obligations.</p>

            <p className="mt-8 text-sm">This is a placeholder privacy policy. In a real application, this would contain detailed, legally reviewed information about data handling practices.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
