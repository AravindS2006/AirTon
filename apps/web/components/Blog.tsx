import React from 'react';
import { Icon } from './ui/Primitives';

const resources = [
  { k: 'Clinical context', title: 'Glaucoma and eye pressure', text: 'Clinical context from the US National Eye Institute. Pressure is one part of glaucoma assessment.', url: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/glaucoma/glaucoma-and-eye-pressure' },
  { k: 'Design reference', title: 'Designing for home use', text: 'FDA design guidance addresses users, the home environment and the device. It is a design reference, not AirTon authorization.', url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-considerations-devices-intended-home-use' },
  { k: 'Separate research', title: 'ACRIMA research dataset', text: 'The original dataset publication provides context for separate retinal-image research. It is not an AirTon pressure dataset.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6425593/' },
];

const Blog: React.FC = () => (
  <div className="page">
    <div className="wrap">
      <header className="page-head">
        <span className="eyebrow">Resources</span>
        <h1 className="display">Research <em>resources</em></h1>
        <p className="lead">Primary sources supporting the project&apos;s clinical and design context. The full citation register and dated progress report are in the local repository.</p>
      </header>
      <div className="grid-3">
        {resources.map((item) => (
          <article key={item.url} className="glass card resource">
            <span className="eyebrow">{item.k}</span>
            <h2 className="h3">{item.title}</h2>
            <p className="body">{item.text}</p>
            <a href={item.url} className="link-arrow" target="_blank" rel="noreferrer">
              Read the source <Icon name="external" size={16} />
            </a>
          </article>
        ))}
      </div>
    </div>
  </div>
);

export default Blog;
