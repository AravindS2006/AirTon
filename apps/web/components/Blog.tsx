import React from 'react';

const resources = [
  { title: 'Glaucoma and eye pressure', text: 'Clinical context from the US National Eye Institute. Pressure is one part of glaucoma assessment.', url: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/glaucoma/glaucoma-and-eye-pressure' },
  { title: 'Designing for home use', text: 'FDA design guidance addresses users, the home environment and the device. It is a design reference, not AirTon authorization.', url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-considerations-devices-intended-home-use' },
  { title: 'ACRIMA research dataset', text: 'The original dataset publication provides context for separate retinal-image research. It is not an AirTon pressure dataset.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6425593/' },
];

const Blog: React.FC = () => (
  <div className="container mx-auto px-6 py-16">
    <h1 className="text-4xl font-bold text-airton-blue-dark mb-6">Research resources</h1>
    <p className="text-airton-gray mb-10">Primary sources supporting the project&apos;s clinical and design context. The full citation register and dated progress report are in the local repository.</p>
    <div className="grid md:grid-cols-3 gap-8">{resources.map((item) => <article key={item.url} className="border rounded-lg p-6"><h2 className="text-xl font-bold mb-3">{item.title}</h2><p className="text-airton-gray mb-4">{item.text}</p><a href={item.url} className="text-airton-blue font-semibold" target="_blank" rel="noreferrer">Read the source</a></article>)}</div>
  </div>
);

export default Blog;
