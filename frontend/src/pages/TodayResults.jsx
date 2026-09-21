{/*import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../api/api.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PieChart from '../components/PieChart.jsx';

export default function TodayResults() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPublicDailyResults()
      .then(setResults)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Unable to load today\u2019s results.'));
  }, []);

  if (error) {
    return (
      <div className="container page-section">
        <ErrorMessage title="Unable to load today's results">{error}</ErrorMessage>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container page-section">
        <p>Loading today's results…</p>
      </div>
    );
  }

  const byCategory = { Female: [], Male: [] };
  (results.results || []).forEach((r) => {
    if (byCategory[r.category]) byCategory[r.category].push(r);
  });

  return (
    <div className="container page-section">
      <h1>Today's Votes</h1>
      <p className="page-intro">
        Live distribution for {results.votingDay} — {results.totalVotes} vote{results.totalVotes === 1 ? '' : 's'} from{' '}
        {results.uniqueVoters} voter{results.uniqueVoters === 1 ? '' : 's'} so far today. Standings reset each new voting day
        and are separate from the official final results.
      </p>

      <div className="daily-results-grid">
        <div className="card">
          <h2>Female</h2>
          <PieChart data={byCategory.Female.map((r) => ({ label: r.contestantName, value: r.voteCount }))} />
        </div>
        <div className="card">
          <h2>Male</h2>
          <PieChart data={byCategory.Male.map((r) => ({ label: r.contestantName, value: r.voteCount }))} />
        </div>
      </div>
    </div>
  );
}
*/}
