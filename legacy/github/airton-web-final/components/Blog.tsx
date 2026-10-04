import React from 'react';
import { Link } from 'react-router-dom';

const blogPosts = [
  {
    id: 1,
    title: 'Understanding Intraocular Pressure: What You Need to Know',
    excerpt: 'Glaucoma is often called the "silent thief of sight." A key indicator is elevated intraocular pressure (IOP). Learn what IOP is, how it\'s measured, and why it matters for your eye health.',
    author: 'Dr. Kenji Tanaka',
    date: 'October 26, 2023',
    imageUrl: 'https://picsum.photos/seed/blog1/600/400'
  },
  {
    id: 2,
    title: 'The Future of Home Eye Care: AirTon\'s Technology Explained',
    excerpt: 'We dive deep into the micro-air pulse technology that powers the AirTon device, making non-invasive and accurate IOP measurement possible from the comfort of your home.',
    author: 'Ben Carter',
    date: 'October 15, 2023',
    imageUrl: 'https://picsum.photos/seed/blog2/600/400'
  },
  {
    id: 3,
    title: '5 Lifestyle Tips for Maintaining Healthy Eyes',
    excerpt: 'Beyond regular check-ups, there are daily habits that can contribute to long-term eye health. From diet to screen time, here are five tips you can start implementing today.',
    author: 'AirTon Health Team',
    date: 'September 28, 2023',
    imageUrl: 'https://picsum.photos/seed/blog3/600/400'
  },
];

const Blog: React.FC = () => {
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-airton-blue-dark mb-4">AirTon Blog</h1>
          <p className="text-lg text-airton-gray">
            The latest news, insights, and stories on eye health and our technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <img src={post.imageUrl} alt={post.title} className="h-56 w-full object-cover"/>
              <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-xl font-bold text-airton-blue-dark mb-2">{post.title}</h2>
                <p className="text-airton-gray text-sm mb-4 flex-grow">{post.excerpt}</p>
                <div>
                  <p className="text-xs text-gray-500">{post.author} &middot; {post.date}</p>
                  <a href="#" className="text-airton-blue font-semibold text-sm mt-2 inline-block">Read More &rarr;</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
