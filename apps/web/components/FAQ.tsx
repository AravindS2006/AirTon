import React from 'react';

const faqs = [
  {
    question: 'What is glaucoma?',
    answer: 'Glaucoma is a group of eye conditions that damage the optic nerve, the health of which is vital for good vision. This damage is often caused by an abnormally high pressure in your eye (intraocular pressure).',
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
    question: 'Is the AirTon device a substitute for a doctor\'s visit?',
    answer: 'The intended product supports monitoring under a care team. Eye pressure alone cannot establish or exclude glaucoma and does not replace clinical examinations.',
  },
  {
    question: 'How is my data kept secure?',
    answer: 'This prototype does not have a clinical data service. Production authorization, encryption, consent, audit trails, retention and privacy obligations are documented as development work in the repository.',
  },
];

const FAQ: React.FC = () => {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-airton-blue-dark mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-airton-gray">
            Find answers to common questions about AirTon and glaucoma care.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-airton-blue-dark mb-2">{faq.question}</h3>
              <p className="text-airton-gray">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
