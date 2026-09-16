import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';
import PieChart from '../../../components/PieChart.jsx';

export default function DailyResults() {
  const { idToken } = useAuth();
  const [days, setDays] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.adminVotingDaysList(idToken).then((list) => {
      setDays(list);
      const past = list.filter((d) => new Date(d.votingDay) <= new Date());
      const today = past.length ? past[past.length - 1] : list[0];
      if (today) setSelectedDay(today);
    }).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load voting days.'));
  }, [idToken]);

  useEffect(() => {
    if (!selectedDay) return;
    api.adminDailyResults(idToken, selectedDay.votingDay).then(setResults).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load results.'));
  }, [idToken, selectedDay]);

  if (error) return <ErrorMessage title="Unable to load daily results">{error}</ErrorMessage>;

  const byCategory = { Female: [], Male: [] };
  (results?.results || []).forEach((r) => {
    if (byCategory[r.category]) byCategory[r.category].push(r);
  });

  return (
    <div>
      <h1>Today's Votes &amp; Daily Results</h1>

      <div className="day-selector" role="tablist" aria-label="Select voting day">
        {(days || []).map((d) => (
          <button
            key={d.votingDay}
            className={`day-selector__item ${selectedDay?.votingDay === d.votingDay ? 'is-active' : ''}`}
            onClick={() => setSelectedDay(d)}
          >
            Day {d.dayNumber}
          </button>
        ))}
      </div>

      {!results ? (
        <p>Loading…</p>
      ) : (
        <div className="daily-results-grid">
          <div className="card">
            <h2>Day {selectedDay.dayNumber} — {results.votingDay}</h2>
            <p>Total votes: <strong>{results.totalVotes}</strong> · Unique voters: <strong>{results.uniqueVoters}</strong></p>
            <table className="results-table">
              <thead>
                <tr><th scope="col">Contestant</th><th scope="col">Category</th><th scope="col">Votes</th><th scope="col">%</th></tr>
              </thead>
              <tbody>
                {results.results.map((r) => (
                  <tr key={r.contestantId}>
                    <td>{r.contestantName}</td>
                    <td>{r.category}</td>
                    <td>{r.voteCount}</td>
                    <td>{r.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2>Female Distribution</h2>
            <PieChart data={byCategory.Female.map((r) => ({ label: r.contestantName, value: r.voteCount }))} />
          </div>
          <div className="card">
            <h2>Male Distribution</h2>
            <PieChart data={byCategory.Male.map((r) => ({ label: r.contestantName, value: r.voteCount }))} />
          </div>
        </div>
      )}
    </div>
  );
}
