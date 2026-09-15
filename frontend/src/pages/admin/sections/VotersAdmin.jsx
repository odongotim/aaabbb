import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';

export default function VotersAdmin() {
  const { idToken } = useAuth();
  const [voters, setVoters] = useState(null);
  const [filters, setFilters] = useState({ votingDay: '', contestantId: '', status: '' });
  const [error, setError] = useState(null);

  function load() {
    api.adminListVoters(idToken, {
      votingDay: filters.votingDay || undefined,
      contestantId: filters.contestantId || undefined,
      status: filters.status || undefined
    }).then(setVoters).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load voters.'));
  }

  useEffect(load, [idToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1>Voters</h1>
      <p className="page-intro">Voter identity is masked. Use filters to review activity by day, contestant, or status.</p>

      {error && <ErrorMessage title="Unable to load voters">{error}</ErrorMessage>}

      <form className="card admin-form admin-form--inline" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <div className="field">
          <label>Voting day (YYYY-MM-DD)</label>
          <input type="text" placeholder="2026-09-15" value={filters.votingDay} onChange={(e) => setFilters({ ...filters, votingDay: e.target.value })} />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>
        <button className="btn btn--secondary" type="submit">Apply Filters</button>
      </form>

      <table className="results-table admin-table">
        <thead>
          <tr>
            <th scope="col">Voting Day</th>
            <th scope="col">Time</th>
            <th scope="col">Contestant</th>
            <th scope="col">Status</th>
            <th scope="col">Voter</th>
          </tr>
        </thead>
        <tbody>
          {(voters || []).map((v, i) => (
            <tr key={i}>
              <td>{v.votingDay}</td>
              <td>{new Date(v.timestamp).toLocaleString()}</td>
              <td>{v.contestantName}</td>
              <td>{v.status}</td>
              <td>{v.maskedEmail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
