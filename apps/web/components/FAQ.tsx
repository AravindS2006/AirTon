import React from 'react';

const faqs = [
  {
    question: 'What is glaucoma?',
    answer:
      'Glaucoma is a group of eye conditions that damage the optic nerve, the health of which is vital for good vision. This damage is often caused by an abnormally high pressure in your eye (intraocular pressure).',
  },
  {
    question: 'Can I use AirTon to take measurements today?',
    answer: 'This is an interface demonstration. No device is connected, and its readings are fictional. Safety, measurement performance and home operation require validation before a clinical release.',
  },
  {
    question: 'How often should I measure my IOP?',
    answer: 'A monitoring schedule must come from your treating eye care professional. This demonstration does not prescribe a schedule, thresholds or treatment decisions.',
  },
  {
    question: "Is the AirTon device a substitute for a doctor's visit?",
    answer: 'The intended product supports monitoring under a care team. Eye pressure alone cannot establish or exclude glaucoma and does not replace clinical examinations.',
  },
  {
    question: 'Why would AirTon show no reading at all?',
    answer:
      'Each attempt is checked for alignment, blinks, signal quality and uncertainty. An attempt that fails is recorded with its reason and no pressure value, because a wrong number is more harmful than no number.',
  },
  {
    question: 'How is my data kept secure?',
    answer:
      'This prototype does not have a clinical data service. Production authorization, encryption, consent, audit trails, retention and privacy obligations are documented as development work in the repository.',
  },
];

const FAQ: React.FC = () => (
  <div className="page">
    <div className="wrap narrow">
      <header className="page-head">
        <span className="eyebrow">FAQ</span>
        <h1 className="display">Frequently asked <em>questions</em></h1>
        <p className="lead">Answers to common questions about AirTon and glaucoma care.</p>
      </header>
      <div className="faq">
        {faqs.map((faq) => (
          <details key={faq.question} className="faq-item">
            <summary>
              <span>{faq.question}</span>
              <i aria-hidden="true" />
            </summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </div>
);

export default FAQ;
