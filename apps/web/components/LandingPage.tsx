import React from 'react';
import { Link } from 'react-router-dom';

const workstreams = [
  { title: 'Pressure measurement', text: 'The proposed non-contact instrument needs repeatable bench signals, independent safety controls and comparison with a reference method.' },
  { title: 'Home operation', text: 'Positioning guidance, training, rejected acquisitions and representative patient usability are planned design and validation work.' },
  { title: 'Connected care', text: 'The proposed pathway shares eye-specific history with an assigned care team. This interface currently displays fictional records.' },
];

const LandingPage: React.FC = () => (
  <div className="bg-white">
    <section className="py-20 md:py-32 bg-airton-blue-light">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-airton-blue-dark mb-4">Eye-pressure monitoring, closer to home.</h1>
        <p className="text-lg md:text-xl text-airton-gray max-w-3xl mx-auto mb-8">AirTon is developing a portable, affordable system for patients to monitor intraocular pressure at home under a doctor&apos;s care.</p>
        <Link to="/login" className="inline-block bg-airton-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-airton-blue-dark shadow-lg">Explore the demo</Link>
      </div>
    </section>
    <section id="vision" className="py-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl font-bold text-airton-blue-dark mb-4">A project in development</h2>
        <p className="text-airton-gray mb-4">The recovered project includes device concept drawings, retinal-image learning experiments and web prototypes. Measurement accuracy, safe home operation and the complete device-to-doctor pathway still require verification and validation.</p>
        <p className="text-airton-gray">Eye pressure alone cannot establish or exclude glaucoma. The first product direction is monitoring within an existing care relationship. Retinal classification remains a separate research workstream.</p>
      </div>
    </section>
    <section id="technology" className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-airton-blue-dark mb-10">What the team is working toward</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {workstreams.map((item) => <article key={item.title} className="bg-white p-6 rounded-lg shadow-md"><h3 className="font-semibold text-lg mb-3">{item.title}</h3><p className="text-airton-gray">{item.text}</p></article>)}
        </div>
      </div>
    </section>
    <section id="contact" className="py-16">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-airton-blue-dark mb-4">Explore the project</h2>
        <p className="text-airton-gray mb-6">The local repository contains the dated specification, evidence register, model and dataset audits, clinical plans and engineering backlog. This demo does not accept enquiries or patient information.</p>
        <Link to="/about" className="text-airton-blue font-semibold">Read about AirTon</Link>
      </div>
    </section>
  </div>
);

export default LandingPage;
