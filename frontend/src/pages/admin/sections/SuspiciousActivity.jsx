import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';

export default function SuspiciousActivity() {
  const { idToken } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.adminSuspiciousActivity(idToken).then(setItems).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load.'));
  }

  useEffect(load, [idToken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function review(item, newStatus) {
    try {
      await api.adminReviewSuspicious(idToken, item.timestamp, item.emailHash, newStatus);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update.');
    }
  }

  if (error) return <ErrorMessage title="Unable to load suspicious activity">{error}</ErrorMessage>;

  return (
    <div>
      <h1>Suspicious Activity</h1>
      <p className="page-intro">
        These are automated signals for review — not accusations. Investigate before taking any action against an account.
      </p>

      <table className="results-table admin-table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Event</th>
            <th scope="col">Risk</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(items || []).map((s, i) => (
            <tr key={i}>
              <td>{new Date(s.timestamp).toLocaleString()}</td>
              <td>{s.event}</td>
              <td>{s.riskLevel}</td>
              <td>{s.status}</td>
              <td>
                {s.status === 'OPEN' && (
                  <>
                    <button className="link-button" onClick={() => review(s, 'REVIEWED')}>Mark Reviewed</button>
                    {' · '}
                    <button className="link-button" onClick={() => review(s, 'DISMISSED')}>Dismiss</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
