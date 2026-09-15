import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';

export default function Overview() {
  const { idToken } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.adminOverview(idToken).then(setData).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load.'));
  }, [idToken]);

  if (error) return <ErrorMessage title="Unable to load overview">{error}</ErrorMessage>;
  if (!data) return <p>Loading…</p>;

  const stats = [
    ['Voting Status', data.votingStatus.replace('_', ' ')],
    ['Current Voting Day', data.currentVotingDay > 0 ? `Day ${data.currentVotingDay} of ${data.totalDays}` : '—'],
    ['Days Completed', data.daysCompleted],
    ['Days Remaining', data.daysRemaining],
    ["Today's Total Votes", data.todayTotalVotes],
    ["Today's Unique Voters", data.todayUniqueVoters],
    ['Total Votes Since Start', data.totalVotesSinceStart],
    ['Open Suspicious Activity', data.suspiciousActivityCount]
  ];

  return (
    <div>
      <h1>Overview</h1>
      <p className="page-intro">{data.pageantName} — {data.edition}</p>
      <div className="stat-grid">
        {stats.map(([label, value]) => (
          <div className="card stat-card" key={label}>
            <p className="stat-card__label">{label}</p>
            <p className="stat-card__value">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
