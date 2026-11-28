import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Scene from './immersive/Scene';
import { prefersReducedMotion } from './immersive/Iris';
import ApplanationLab from './ApplanationLab';
import EyeCrossSection from './EyeCrossSection';
import { EvidenceLadder, Icon } from './ui/Primitives';
import type { Level } from './ui/Primitives';

export const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
};

const SectionHead: React.FC<{ eyebrow: string; title: React.ReactNode; lit?: Level[]; id: string }> = ({ eyebrow, title, lit = [], id }) => (
  <header className="section-head">
    <div className="section-meta">
      <span className="eyebrow">{eyebrow}</span>
      <EvidenceLadder lit={lit} compact />
    </div>
    <h2 className="display" id={id}>{title}</h2>
  </header>
);

const workstreams = [
  { icon: 'target', title: 'Pressure measurement', text: 'The proposed non-contact instrument needs repeatable bench signals, independent safety controls and comparison with a reference method.' },
  { icon: 'user', title: 'Home operation', text: 'Positioning guidance, training, rejected acquisitions and representative patient usability are planned design and validation work.' },
  { icon: 'cloud', title: 'Connected care', text: 'The proposed pathway shares eye-specific history with an assigned care team. This interface currently displays fictional records.' },
];

const modes = [
  { k: 'Contact', title: 'Goldmann applanation', text: 'The usual clinical reference. A probe touches the cornea, so it needs a trained professional and a clinic visit.' },
  { k: 'Non-contact', title: 'Clinic air-puff tonometer', fig: '≈ ₹3,00,000', text: 'Comfortable and fast, but priced and built for clinics. Figure from the 2024 Smart India Hackathon submission.' },
  { k: 'Self-use, with a probe', title: 'Rebound devices', text: 'Home use exists, but a probe still touches the cornea. They are not non-contact.' },
];

const layers = [
  { n: 'Layer 1', title: 'Deterministic rules', text: 'Untrusted clock, expired calibration, missing signal, misalignment, blink, saturation or low signal-to-noise.' },
  { n: 'Layer 2', title: 'Learned quality gate', text: 'A gradient-boosted model tuned to catch 95% of artifacts on calibration data.' },
  { n: 'Layer 3', title: 'Out-of-domain gate', text: 'Rejects signals unlike anything the model was evaluated on.' },
  { n: 'Layer 4', title: 'Uncertainty gate', text: 'Withholds the value when its calibrated interval is too wide.' },
];

const flow = [
  { icon: 'target', title: 'Capture', text: 'ID, eye and time are assigned at capture, with clock trust.' },
  { icon: 'lock', title: 'Encrypted outbox', text: 'Each reading waits safely on the device until delivery is confirmed.' },
  { icon: 'device', title: 'Gateway', text: 'A phone over Bluetooth, or direct Wi-Fi.' },
  { icon: 'shield', title: 'Ingestion', text: 'Authorise the device, check the record, drop duplicates, verify hashes.' },
  { icon: 'database', title: 'Provenance store', text: 'Readings keep their device, calibration and model identity.' },
  { icon: 'user', title: 'Clinician review', text: 'Acknowledge, or amend with author, time and reason. The original is kept.' },
];

const rungs = [
  { l: 'released', text: 'No release, sale or launch on record', on: false },
  { l: 'clinical', text: 'No AirTon clinical study yet', on: false },
  { l: 'bench', text: 'No physical measurement yet', on: false },
  { l: 'synthetic', text: 'Estimation stack and retinal framework, verified on synthetic data', on: true },
  { l: 'proposed', text: 'Specification, architecture and 26 requirements', on: true },
  { l: 'supplied', text: 'Decks, notebooks, app prototypes, this web app, concept drawings', on: true },
];

const LandingPage: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    const section = (location.state as { section?: string } | null)?.section;
    if (section) {
      const t = window.setTimeout(() => scrollToId(section), 80);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [location]);

  return (
    <>
      <Scene
        id="top"
        className="hero"
        labelledBy="hero-title"
        iris={{ d: { x: 0.74, y: 0.55, r: 0.4, i: 1, p: 0.3, fix: 1 }, m: { x: 0.5, y: 0.34, r: 0.5, i: 0.5, p: 0.3, fix: 1 } }}
      >
        <div className="hero-jet" aria-hidden="true">
          <i style={{ top: 18, width: 520 }} />
          <i style={{ top: 44, width: 760 }} />
          <i style={{ top: 62, width: 980 }} />
          <i style={{ top: 80, width: 640 }} />
          <i style={{ top: 104, width: 420 }} />
        </div>
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="kicker rise" style={{ '--d': '100ms' } as React.CSSProperties}>Home eye-pressure monitoring, under a doctor&apos;s care</p>
            <h1 className="wordmark" id="hero-title" aria-label="AirTon">
              <span aria-hidden="true">Air</span>
              <span aria-hidden="true">Ton</span>
            </h1>
            <p className="hero-tag rise" style={{ '--d': '1300ms' } as React.CSSProperties}>
              A gentle puff of air, two flashes of light and a pressure reading <b>with its uncertainty</b>. When the signal is not good enough, <b>no reading at all</b>.
            </p>
            <p className="body rise" style={{ '--d': '1500ms' } as React.CSSProperties}>
              AirTon is developing a portable, affordable system for patients to monitor intraocular pressure at home under a doctor&apos;s care.
            </p>
            <div className="cta-row rise" style={{ '--d': '1700ms' } as React.CSSProperties}>
              <Link to="/login" className="btn">
                Explore the demo <Icon name="arrow" size={18} />
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => scrollToId('how')}>
                <Icon name="wind" size={18} /> Fire a simulated puff
              </button>
            </div>
          </div>
        </div>
        <div className="wrap hero-foot rise" style={{ '--d': '2000ms' } as React.CSSProperties}>
          <span>Concept and research stage</span>
          <span>No device connected</span>
          <span>Fictional demo data</span>
        </div>
      </Scene>

      <Scene id="problem" labelledBy="problem-title" iris={{ d: { x: 1.04, y: 0.38, r: 0.32, i: 0.55 }, m: { x: 1.1, y: 0.15, r: 0.45, i: 0.35 } }}>
        <div className="wrap split">
          <div className="stack-lg">
            <SectionHead id="problem-title" eyebrow="The problem" title={<>The pressure you <em>cannot feel</em></>} />
            <p className="lead">
              Glaucoma damages the optic nerve, often with no early symptoms. Doctors follow <b>intraocular pressure (IOP)</b> over months and years to manage it, so
              patients under care need it measured again and again.
            </p>
            <blockquote className="quote">
              <p>Pressure alone cannot establish or exclude glaucoma.</p>
              <cite>
                <a href="https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/glaucoma/glaucoma-and-eye-pressure" target="_blank" rel="noreferrer">
                  US National Eye Institute <Icon name="external" size={14} />
                </a>
              </cite>
            </blockquote>
            <p className="body">
              So AirTon <b>measures pressure</b>. The <b>clinician interprets</b> it, alongside the patient&apos;s examinations and care plan.
            </p>
          </div>
          <EyeCrossSection />
        </div>
      </Scene>

      <Scene id="today" labelledBy="today-title" iris={{ d: { x: -0.08, y: 0.7, r: 0.4, i: 0.4 }, m: { x: -0.2, y: 0.8, r: 0.5, i: 0.3 } }}>
        <div className="wrap stack-lg">
          <SectionHead id="today-title" eyebrow="Today" lit={['supplied']} title={<>Eye pressure is measured <em>in the clinic</em></>} />
          <div className="grid-3">
            {modes.map((m) => (
              <article key={m.title} className="glass card">
                <span className="eyebrow">{m.k}</span>
                <h3 className="h3">{m.title}</h3>
                {m.fig && <p className="fig">{m.fig}</p>}
                <p className="body">{m.text}</p>
              </article>
            ))}
          </div>
        </div>
      </Scene>

      <Scene id="how" labelledBy="how-title" iris={{ d: { x: 1.1, y: 0.92, r: 0.4, i: 0.22 }, m: { x: 1.2, y: 1, r: 0.4, i: 0.15 } }}>
        <div className="wrap stack-lg">
          <SectionHead id="how-title" eyebrow="Measurement physics" lit={['synthetic']} title={<>How a puff of air <em>reads pressure</em></>} />
          <ol className="steps-3">
            <li>
              <b>A 32 ms air pulse</b> rises and falls against the cornea.
            </li>
            <li>
              On the way in the cornea <b>flattens once</b> and reflects light straight into the detector. That pressure is <b className="c-fluor">P1</b>.
            </li>
            <li>
              The cornea lags, so it flattens again on the way out at a lower pressure, <b className="c-fluor">P2</b>. Their midpoint tracks <b>IOP plus corneal resistance</b>.
            </li>
          </ol>
          <ApplanationLab />
          <Link to="/demo" className="link-arrow">
            Run the full IOP estimation engine on simulated scenarios <Icon name="arrow" size={16} />
          </Link>
        </div>
      </Scene>

      <Scene id="safety" labelledBy="safety-title" iris={{ d: { x: 0.5, y: 1.25, r: 0.75, i: 0.4 }, m: { x: 0.5, y: 1.2, r: 0.8, i: 0.3 } }}>
        <div className="wrap stack-lg">
          <SectionHead id="safety-title" eyebrow="Estimation stack" lit={['synthetic']} title={<>A wrong number is <em>worse than no number</em></>} />
          <div className="layers">
            {layers.map((l) => (
              <article key={l.title} className="layer">
                <span className="eyebrow c-alarm">{l.n}</span>
                <h3 className="h3">{l.title}</h3>
                <p className="body">{l.text}</p>
              </article>
            ))}
          </div>
          <div className="stats-4">
            <div className="stat">
              <span className="num c-paper">607 / 900</span>
              <p>Acquisitions accepted on the held-out test set. Every rejection carries a named reason and no value.</p>
            </div>
            <div className="stat">
              <span className="num c-fluor">0.0%</span>
              <p>Artifacts that leaked into accepted readings.</p>
            </div>
            <div className="stat">
              <span className="num c-paper">17.4%</span>
              <p>Clean acquisitions also rejected: the price of caution, reported openly.</p>
            </div>
            <div className="stat">
              <span className="num">
                <span className="c-ember">7.25</span> <span className="c-faint">→</span> <span className="c-fluor">1.84</span>
              </span>
              <p>Error (RMSE, mmHg) for the same model, ungated and then gated.</p>
            </div>
          </div>
          <p className="src">Held-out synthetic results from the repository&apos;s v0.3.0 model card. They verify software behaviour, not AirTon or clinical accuracy.</p>
        </div>
      </Scene>

      <Scene id="pathway" labelledBy="pathway-title" iris={{ d: { x: 1.05, y: 0.15, r: 0.45, i: 0.35 }, m: { x: 1.15, y: 0.1, r: 0.5, i: 0.25 } }}>
        <div className="wrap stack-lg">
          <SectionHead id="pathway-title" eyebrow="Connected care" lit={['proposed', 'synthetic']} title={<>From the eye to the doctor, <em>without losing a reading</em></>} />
          <ol className="flow">
            {flow.map((f, i) => (
              <li key={f.title} style={{ '--i': i } as React.CSSProperties}>
                <span className="flow-dot">
                  <Icon name={f.icon} size={28} />
                </span>
                <h3 className="h4">{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ol>
          <div className="triad">
            <div>
              <b className="c-cobalt">Saved on device</b>
              <span>Captured and queued, even with no network.</span>
            </div>
            <div>
              <b className="c-paper">Delivered</b>
              <span>The server confirmed receipt. A failure never looks like success.</span>
            </div>
            <div>
              <b className="c-fluor">Reviewed</b>
              <span>A clinician has looked. Uploading is not the same as being seen.</span>
            </div>
          </div>
        </div>
      </Scene>

      <Scene id="technology" labelledBy="tech-title" iris={{ d: { x: -0.1, y: 0.3, r: 0.4, i: 0.4 }, m: { x: -0.2, y: 0.2, r: 0.5, i: 0.3 } }}>
        <div className="wrap stack-lg">
          <SectionHead id="tech-title" eyebrow="Workstreams" lit={['proposed']} title={<>What the team is <em>working toward</em></>} />
          <div className="grid-3">
            {workstreams.map((w) => (
              <article key={w.title} className="glass card">
                <span className="card-icon">
                  <Icon name={w.icon} size={26} />
                </span>
                <h3 className="h3">{w.title}</h3>
                <p className="body">{w.text}</p>
              </article>
            ))}
          </div>
        </div>
      </Scene>

      <Scene id="evidence" labelledBy="evidence-title" iris={{ d: { x: 1.04, y: 0.5, r: 0.34, i: 0.45, p: 0.34 }, m: { x: 1.15, y: 0.4, r: 0.45, i: 0.25 } }}>
        <div className="wrap split split-tight">
          <div className="stack-lg">
            <SectionHead id="evidence-title" eyebrow="Evidence" lit={['supplied', 'proposed', 'synthetic']} title={<>What is <em>real</em> today</>} />
            <p className="lead">
              The recovered project includes device concept drawings, retinal-image learning experiments and web prototypes. Measurement accuracy, safe home operation and the
              complete device-to-doctor pathway still require verification and validation.
            </p>
            <p className="body">
              Eye pressure alone cannot establish or exclude glaucoma. The first product direction is monitoring within an existing care relationship. Retinal classification
              remains a separate research workstream.
            </p>
          </div>
          <ul className="rungs">
            {rungs.map((r) => (
              <li key={r.l} className={r.on ? `on on-${r.l}` : 'off'}>
                <b>{r.l}</b>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Scene>

      <Scene id="contact" className="finale" labelledBy="contact-title" iris={{ d: { x: 0.5, y: 0.62, r: 0.34, i: 0.85, p: 0.26, fix: 1 }, m: { x: 0.5, y: 0.7, r: 0.5, i: 0.5, fix: 1 } }}>
        <div className="wrap finale-inner">
          <h2 className="display" id="contact-title">
            Explore <em>the project</em>
          </h2>
          <p className="lead">
            The local repository contains the dated specification, evidence register, model and dataset audits, clinical plans and engineering backlog. This demo does not
            accept enquiries or patient information.
          </p>
          <div className="cta-row center">
            <Link to="/login" className="btn">
              Open the dashboards <Icon name="arrow" size={18} />
            </Link>
            <Link to="/demo" className="btn btn-ghost">
              Try the research models
            </Link>
            <Link to="/about" className="btn btn-ghost">
              Read about AirTon
            </Link>
          </div>
        </div>
      </Scene>
    </>
  );
};

export default LandingPage;
