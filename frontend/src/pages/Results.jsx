import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../api/api.js';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Results() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPublicFinalResults()
      .then(setResults)
      .catch((e) => setError(e instanceof ApiError ? e : { code: 'ERROR', message: 'System temporarily unavailable.' }));
  }, []);

  if (error) {
    return (
      <div className="container page-section">
        <ErrorMessage
          title={error.code === 'RESULTS_NOT_RELEASED' ? 'Results not yet available' : 'Unable to load results'}
          tone="info"
        >
          {error.code === 'RESULTS_NOT_RELEASED'
            ? 'Overall results remain confidential while voting is active. Final results will be published here once voting closes.'
            : error.message}
        </ErrorMessage>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container page-section">
        <p>Loading results…</p>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <h1>Final Results</h1>
      <p className="page-intro">Lira University Pageantry, 4th Edition — official final results.</p>

      {Object.keys(results).map((category) => (
        <section className="category-section" key={category}>
          <h2 className="category-section__title">{category}</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th scope="col">Position</th>
                <th scope="col">Contestant</th>
                <th scope="col">Total Votes</th>
                <th scope="col">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {results[category].map((r) => (
                <tr key={r.contestantId}>
                  <td>{r.position}</td>
                  <td>{r.name}</td>
                  <td>{r.count}</td>
                  <td>{r.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
