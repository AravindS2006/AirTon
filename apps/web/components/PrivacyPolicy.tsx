import React from 'react';

const PrivacyPolicy: React.FC = () => (
  <div className="page">
    <div className="wrap narrow">
      <header className="page-head">
        <span className="eyebrow">Privacy</span>
        <h1 className="display display-sm">Demonstration privacy information</h1>
      </header>
      <div className="prose">
        <p>
          This local interface uses fictional profiles and readings. The role selector does not create an account or authenticate a patient. Do not enter real health
          information in demonstration controls.
        </p>
        <p>
          Styles, scripts, fonts and icons are built and served locally. The interface makes no requests to third-party services; external pages open only when you
          follow a source link. The research demo page talks only to the local demo API you start yourself (loopback by default). Images uploaded there are analysed in
          memory and not stored. The app has not been prepared as a private clinical system.
        </p>
        <p>
          A future clinical service requires a reviewed privacy notice, purpose and access controls, retention rules, patient rights handling, vendor governance and incident
          response. No HIPAA certification or production privacy compliance is asserted for this prototype.
        </p>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
