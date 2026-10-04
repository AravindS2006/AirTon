import React from 'react';

const teamMembers = [
    { name: 'Saravanan R K', role: 'Founder & CEO', avatar: 'https://picsum.photos/seed/evelynreed/200' },
    { name: 'Aravindselvan', role: 'Chief Technical Officer', avatar: 'https://picsum.photos/seed/bencarter/200' },
    { name: 'Vasanth', role: 'Chief Finance Officer', avatar: 'https://picsum.photos/seed/kenjitanaka/200' },
];

const AboutUs: React.FC = () => {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-airton-blue-dark mb-4">About AirTon</h1>
          <p className="text-lg text-airton-gray">
            We are dedicated to preventing blindness by making early glaucoma detection accessible to everyone, everywhere.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center my-16">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold text-airton-blue-dark mb-4">Our Mission</h2>
            <p className="text-airton-gray mb-4">
              Our mission is to eliminate preventable blindness caused by glaucoma through innovative, user-friendly technology. We believe that proactive monitoring is the key to preserving sight, and we're committed to creating tools that empower both patients and healthcare providers.
            </p>
            <p className="text-airton-gray">
              By combining precision engineering with intelligent software, we aim to set a new standard in eye care, making it more convenient, accurate, and accessible than ever before.
            </p>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <img src="https://picsum.photos/seed/mission/500/500" alt="Team working" className="rounded-2xl shadow-xl" />
          </div>
        </div>
        
        <section id="team" className="py-16 bg-gray-50 rounded-2xl">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-airton-blue-dark mb-12">Meet Our Team</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {teamMembers.map((member) => (
                  <div key={member.name} className="text-center">
                    <img src={member.avatar} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 shadow-lg"/>
                    <h3 className="font-bold text-lg text-airton-blue-dark">{member.name}</h3>
                    <p className="text-airton-gray">{member.role}</p>
                  </div>
                ))}
              </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AboutUs;
