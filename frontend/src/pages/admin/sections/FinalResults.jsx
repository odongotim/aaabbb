import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';

export default function FinalResults() {
  const { idToken } = useAuth();
  const [settings, setSettings] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    api.getPublicSettings().then(setSettings);
  }, []);

  async function handleRelease() {
    if (!confirm('Release final results publicly? This will make overall standings visible to everyone. This action is logged.')) return;
    setReleasing(true);
    setError(null);
    try {
      const data = await api.adminReleaseFinalResults(idToken);
      setResults(data);
      setSettings((s) => ({ ...s, resultsReleased: true }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to release final results.');
    } finally {
      setReleasing(false);
    }
  }

  return (
    <div>
      <h1>Final Results</h1>
      <p className="page-intro">
        Final results are calculated from all valid votes across the voting period. Historical votes are never altered.
      </p>

      {error && <ErrorMessage title="Unable to release results">{error}</ErrorMessage>}

      {settings && (
        <p>
          Public release status:{' '}
          <strong>{settings.resultsReleased ? 'Released' : 'Not yet released — voting must close first for the public page.'}</strong>
        </p>
      )}

      <button className="btn btn--primary" onClick={handleRelease} disabled={releasing}>
        {releasing ? 'Calculating…' : 'Calculate & Release Final Results'}
      </button>

      {results && Object.keys(results).map((category) => (
        <div className="card" key={category} style={{ marginTop: '1.5rem' }}>
          <h2>{category}</h2>
          <table className="results-table">
            <thead>
              <tr><th scope="col">Position</th><th scope="col">Contestant</th><th scope="col">Votes</th><th scope="col">%</th></tr>
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
        </div>
      ))}
    </div>
  );
}
