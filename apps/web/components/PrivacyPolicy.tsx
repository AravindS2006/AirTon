import React from 'react';

const PrivacyPolicy: React.FC = () => (
  <div className="container mx-auto px-6 py-16 max-w-3xl">
    <h1 className="text-3xl font-bold text-airton-blue-dark mb-6">Demonstration privacy information</h1>
    <p className="text-airton-gray mb-4">This local interface uses fictional profiles and readings. The role selector does not create an account or authenticate a patient. Do not enter real health information in demonstration controls.</p>
    <p className="text-airton-gray mb-4">Styling and application scripts are built locally, using system fonts. Optional icons and some placeholder images still load from external providers. Those requests can expose browser network metadata to those providers. The app has not been prepared as a private clinical system.</p>
    <p className="text-airton-gray">A future clinical service requires a reviewed privacy notice, purpose and access controls, retention rules, patient rights handling, vendor governance and incident response. No HIPAA certification or production privacy compliance is asserted for this prototype.</p>
  </div>
);

export default PrivacyPolicy;
