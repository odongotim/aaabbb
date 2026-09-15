import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';

export default function VoteConfirmed() {
  const { state } = useLocation();

  if (!state || !state.votes || state.votes.length === 0) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container page-section">
      <div className="card confirmation-card">
        <p className="badge badge--open">Vote{state.votes.length > 1 ? 's' : ''} Successfully Recorded</p>
        <h1>Thank you for voting</h1>

        {state.votes.map((vote) => (
          <dl className="confirmation-list" key={vote.voteReference}>
            <div>
              <dt>Category</dt>
              <dd>{vote.category}</dd>
            </div>
            <div>
              <dt>Contestant</dt>
              <dd>{vote.contestantName}</dd>
            </div>
            <div>
              <dt>Contestant Number</dt>
              <dd>{vote.contestantNumber}</dd>
            </div>
            <div>
              <dt>Vote Reference</dt>
              <dd>{vote.voteReference}</dd>
            </div>
          </dl>
        ))}

        <dl className="confirmation-list">
          <div>
            <dt>Voting Day</dt>
            <dd>Day {state.votingDayNumber} ({state.votingDay})</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{new Date(state.timestamp).toLocaleString('en-GB', { timeZone: 'Africa/Kampala' })} EAT</dd>
          </div>
        </dl>

        <p className="confirmation-card__note">
          You may still vote again tomorrow. Each category's vote resets
          after midnight, East Africa Time.
        </p>
        <div className="hero__actions">
          <Link to="/contestants" className="btn btn--secondary">Back to Contestants</Link>
          <Link to="/" className="btn btn--primary">Return Home</Link>
        </div>
      </div>
    </div>
  );
}
