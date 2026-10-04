import React from 'react';

const members = ['Saravanan R K', 'Aravindselvan C', 'Vasanth K'];

const AboutUs: React.FC = () => (
  <div className="container mx-auto px-6 py-16 max-w-3xl">
    <h1 className="text-4xl font-bold text-airton-blue-dark mb-6">About AirTon</h1>
    <p className="text-lg text-airton-gray mb-6">AirTon began with a home-use non-contact eye-pressure measurement concept in a 2024 idea submission. Its first commercial direction is now home monitoring for patients already under a doctor&apos;s care.</p>
    <p className="text-airton-gray mb-10">The project brings together instrumentation, machine learning research and connected reporting. Recovered source files document real experiments and interface prototypes. They do not establish clinical validation or a released medical device.</p>
    <h2 className="text-2xl font-bold text-airton-blue-dark mb-4">Original team attribution</h2>
    <ul className="space-y-2 text-airton-gray">{members.map((name) => <li key={name}>{name}</li>)}</ul>
    <p className="text-airton-gray mt-6">The supplied July 2025 deck attributes the team to Sri Sairam Engineering College, Chennai. Current corporate roles, ownership and company status need confirmation before publication.</p>
  </div>
);

export default AboutUs;
