import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';

export default function AuditLogs() {
  const { idToken } = useAuth();
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.adminAuditLogs(idToken).then(setLogs).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load.'));
  }, [idToken]);

  if (error) return <ErrorMessage title="Unable to load audit logs">{error}</ErrorMessage>;

  return (
    <div>
      <h1>Audit Logs</h1>
      <p className="page-intro">A record of every administrative action taken on the platform.</p>

      <table className="results-table admin-table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Administrator</th>
            <th scope="col">Action</th>
            <th scope="col">Target</th>
          </tr>
        </thead>
        <tbody>
          {(logs || []).map((l, i) => (
            <tr key={i}>
              <td>{new Date(l.timestamp).toLocaleString()}</td>
              <td>{l.admin}</td>
              <td>{l.action}</td>
              <td>{l.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
