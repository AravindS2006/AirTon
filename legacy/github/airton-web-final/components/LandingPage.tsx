import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const testimonials = [
    { name: 'Dr. Alisha Chen', role: 'Ophthalmologist', quote: 'AirTon has transformed early glaucoma detection in my practice. It\'s fast, reliable, and patient-friendly.', avatar: 'https://picsum.photos/seed/dralisha/100' },
    { name: 'Mark Roberts', role: 'Patient', quote: 'The screening was so easy and comfortable. It gave me peace of mind knowing my eye health is being monitored accurately.', avatar: 'https://picsum.photos/seed/markroberts/100' },
  ];
  
  const teamMembers = [
    { name: 'Saravanan R K', role: 'Founder & CEO', avatar: 'https://picsum.photos/seed/evelynreed/200' },
    { name: 'Aravindselvan', role: 'Chief Technical Officer', avatar: 'https://picsum.photos/seed/bencarter/200' },
    { name: 'Vasanth', role: 'Chief Finance Officer', avatar: 'https://picsum.photos/seed/kenjitanaka/200' },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your message! In a real application, this would be sent to a server.');
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-airton-blue-light">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-airton-blue-dark mb-4">Early Glaucoma Detection, Redefined.</h1>
          <p className="text-lg md:text-xl text-airton-gray max-w-3xl mx-auto mb-8">AirTon offers a portable, non-invasive intraocular pressure (IOP) analyzer for fast, accurate, and accessible glaucoma screening.</p>
          <div className="flex justify-center space-x-4">
             <Link to="/login" className="bg-airton-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-airton-blue-dark transition-transform hover:scale-105 shadow-lg">Access Dashboard</Link>
             <a href="#technology" className="bg-white text-airton-blue font-bold py-3 px-8 rounded-lg border border-gray-300 hover:bg-gray-100 transition-transform hover:scale-105 shadow-lg">Learn More</a>
          </div>
        </div>
      </section>
      
      {/* Product Showcase */}
      <section id="vision" className="py-20">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-airton-blue-dark mb-4">Clarity in Sight, Simplicity in Hand.</h2>
            <p className="text-airton-gray mb-6">Our state-of-the-art device uses micro-air pulse technology to measure IOP without any contact or anesthesia, providing instant results. Designed for both clinical and home use, it empowers patients and doctors with critical data for proactive eye care.</p>
            <ul className="space-y-4">
                <li className="flex items-start"><i className="text-airton-teal mr-3 mt-1" data-lucide="check-circle"></i><span className="text-gray-700"><strong>Non-Invasive:</strong> Gentle air puff for a comfortable experience.</span></li>
                <li className="flex items-start"><i className="text-airton-teal mr-3 mt-1" data-lucide="check-circle"></i><span className="text-gray-700"><strong>Instant Results:</strong> IOP readings delivered in seconds to our secure app.</span></li>
                <li className="flex items-start"><i className="text-airton-teal mr-3 mt-1" data-lucide="check-circle"></i><span className="text-gray-700"><strong>Portable & Connected:</strong> Easy to use anywhere, with seamless data sync.</span></li>
            </ul>
          </div>
          <div className="flex justify-center">
            <img src="https://picsum.photos/seed/device/500/500" alt="AirTon Device" className="rounded-2xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-12">
                  <h2 className="text-3xl font-bold text-airton-blue-dark">Powered by Precision Engineering</h2>
                  <p className="text-airton-gray mt-4">AirTon integrates cutting-edge sensor technology with intelligent software to provide IOP measurements with unparalleled accuracy.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-md text-center"><i className="text-airton-blue mx-auto mb-4 w-12 h-12" data-lucide="wind"></i><h3 className="font-semibold text-lg mb-2">Micro-Air Pulse</h3><p className="text-sm text-airton-gray">A calibrated air puff deforms the cornea slightly, measured by an optical sensor to calculate IOP.</p></div>
                  <div className="bg-white p-6 rounded-lg shadow-md text-center"><i className="text-airton-blue mx-auto mb-4 w-12 h-12" data-lucide="brain-circuit"></i><h3 className="font-semibold text-lg mb-2">AI-Powered Analysis</h3><p className="text-sm text-airton-gray">Our algorithm analyzes waveforms to ensure accuracy and flag potential anomalies for review.</p></div>
                  <div className="bg-white p-6 rounded-lg shadow-md text-center"><i className="text-airton-blue mx-auto mb-4 w-12 h-12" data-lucide="smartphone-charging"></i><h3 className="font-semibold text-lg mb-2">Seamless Connectivity</h3><p className="text-sm text-airton-gray">Bluetooth syncs data to the AirTon dashboard for real-time tracking and tele-consultation.</p></div>
              </div>
          </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-airton-blue-dark mb-12">Trusted by Professionals and Patients</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-airton-blue-light p-8 rounded-xl">
                <p className="text-airton-gray mb-6">"{t.quote}"</p>
                <div className="flex items-center">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <p className="font-bold text-airton-blue-dark">{t.name}</p>
                    <p className="text-sm text-airton-gray">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-gray-50">
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

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-airton-blue-dark mb-4">Get in Touch</h2>
          <p className="text-airton-gray mb-8">Have questions about our technology or partnerships? We'd love to hear from you.</p>
          <form onSubmit={handleContactSubmit} className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <input type="text" placeholder="Your Name" className="w-full p-3 border rounded-md focus:ring-2 focus:ring-airton-blue outline-none" />
              <input type="email" placeholder="Your Email" className="w-full p-3 border rounded-md focus:ring-2 focus:ring-airton-blue outline-none" />
            </div>
            <textarea placeholder="Your Message" rows={5} className="w-full p-3 border rounded-md mb-6 focus:ring-2 focus:ring-airton-blue outline-none"></textarea>
            <button type="submit" className="bg-airton-teal text-white font-bold py-3 px-8 rounded-lg w-full hover:opacity-90 transition-opacity">Send Message</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;