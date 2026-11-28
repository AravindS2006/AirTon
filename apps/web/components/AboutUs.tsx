import React from 'react';
import { EvidenceLadder, Monogram } from './ui/Primitives';

const members = ['Saravanan R K', 'Aravindselvan C', 'Vasanth K'];

/** Dated artifacts recovered in the repository's evidence register. Plans that were never evidenced are left out. */
const timeline = [
  { date: '23 Aug 2024', title: 'Smart India Hackathon 2024 idea', text: 'Problem 1550: a portable non-contact device to measure eye pressure at home.' },
  { date: 'Nov 2024 – May 2025', title: 'Retinal-image experiments', text: 'Keras and PyTorch notebooks on fundus images, later audited.' },
  { date: 'Feb – Mar 2025', title: 'Six app prototypes', text: 'Hugging Face Spaces built with FastAPI, Streamlit, Gradio and Node.' },
  { date: 'Jul 2025', title: 'Team deck', text: 'A dual-eye concept, a block diagram and a circuit simulation.' },
  { date: 'Aug 2025', title: 'Pitch', text: 'An Arduino/ESP32 prototype reported at about ₹7,000.' },
  { date: 'Nov 2025', title: 'This web app', text: 'Patient, doctor and admin dashboards on fictional data.' },
  { date: 'Sep 2026', title: 'Device concept drawings', text: 'Five sheets, including a patent-style view. No filing is on record.' },
  { date: '4 Oct 2026', title: 'Home monitoring chosen', text: 'The first product direction; sources recovered and audited.' },
  { date: '23 Nov 2026', title: 'Estimation stack v0.3.0', text: 'Layered abstention and calibrated intervals, verified on synthetic data.' },
];

const AboutUs: React.FC = () => (
  <div className="page">
    <div className="wrap">
      <header className="page-head">
        <span className="eyebrow">About</span>
        <h1 className="display">About <em>AirTon</em></h1>
        <p className="lead">
          AirTon began with a home-use non-contact eye-pressure measurement concept in a 2024 idea submission. Its first commercial direction is now home monitoring for
          patients already under a doctor&apos;s care.
        </p>
        <p className="body">
          The project brings together instrumentation, machine learning research and connected reporting. Recovered source files document real experiments and interface
          prototypes. They do not establish clinical validation or a released medical device.
        </p>
      </header>

      <section className="stack-lg" aria-labelledby="tl-title">
        <div className="section-meta">
          <h2 className="eyebrow" id="tl-title">Dated history</h2>
          <EvidenceLadder lit={['supplied', 'synthetic']} compact />
        </div>
        <ol className="vtimeline">
          {timeline.map((t, i) => (
            <li key={t.title} style={{ '--i': i } as React.CSSProperties}>
              <time>{t.date}</time>
              <div>
                <h3 className="h4">{t.title}</h3>
                <p>{t.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="stack-lg team" aria-labelledby="team-title">
        <h2 className="display display-sm" id="team-title">Original team attribution</h2>
        <ul className="team-list">
          {members.map((name, i) => (
            <li key={name} className="glass">
              <Monogram name={name} size={56} tone={(['cobalt', 'ember', 'fluor'] as const)[i]} />
              <span>{name}</span>
            </li>
          ))}
        </ul>
        <p className="body">
          The supplied July 2025 deck attributes the team to Sri Sairam Engineering College, Chennai, guided by Dr. J. Thamil Selvi, Head of the Department of Electronics and
          Communication Engineering. Current corporate roles, ownership and company status need confirmation before publication.
        </p>
      </section>
    </div>
  </div>
);

export default AboutUs;
