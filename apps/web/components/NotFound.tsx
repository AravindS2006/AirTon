import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div className="page notfound">
    <div className="wrap narrow center">
      <p className="mono reason-code">quality_reasons: [&quot;signal_missing&quot;]</p>
      <h1 className="display">404 · <em>no reading</em></h1>
      <p className="lead">This page returned no applanation event, so it reports nothing rather than something wrong.</p>
      <Link to="/" className="btn">
        Back to the start
      </Link>
    </div>
  </div>
);

export default NotFound;
