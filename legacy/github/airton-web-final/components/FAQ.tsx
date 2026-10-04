import React from 'react';

const faqs = [
  {
    question: 'What is glaucoma?',
    answer: 'Glaucoma is a group of eye conditions that damage the optic nerve, the health of which is vital for good vision. This damage is often caused by an abnormally high pressure in your eye (intraocular pressure).',
  },
  {
    question: 'Is the AirTon measurement painful?',
    answer: 'Not at all. The AirTon device uses a gentle puff of air to measure eye pressure. It\'s a non-contact, non-invasive procedure that is quick and completely painless.',
  },
  {
    question: 'How often should I measure my IOP?',
    answer: 'The frequency of measurement should be determined by your eye care professional. For patients at high risk, more frequent monitoring may be recommended. The AirTon device makes it easy to follow your doctor\'s plan.',
  },
  {
    question: 'Is the AirTon device a substitute for a doctor\'s visit?',
    answer: 'No. The AirTon device is a tool for monitoring intraocular pressure between visits to your ophthalmologist. It provides valuable data but does not replace comprehensive eye exams.',
  },
  {
    question: 'How is my data kept secure?',
    answer: 'We take data privacy very seriously. All data is encrypted during transmission and at rest on our secure, HIPAA-compliant servers. You have full control over who can see your information.',
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
