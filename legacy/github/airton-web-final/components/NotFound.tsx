import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-white">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-airton-blue tracking-widest">404</h1>
        <div className="bg-airton-teal px-2 text-sm rounded rotate-12 absolute">
          Page Not Found
        </div>
        <p className="mt-4 text-lg text-airton-gray">Sorry, we couldn't find the page you're looking for.</p>
        <Link 
          to="/"
          className="mt-6 inline-block bg-airton-blue text-white font-semibold px-6 py-3 rounded-lg hover:bg-airton-blue-dark transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
