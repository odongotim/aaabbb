import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/api.js';
import Countdown from '../components/Countdown.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Landing() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPublicBootstrap()
      .then(({ settings }) => setSettings(settings))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'System temporarily unavailable.'));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero__row">
          <div className="hero__copy">
            <p className="eyebrow">Official Voting Platform</p>
            <h1 className="hero__title">Lira University Pageantry</h1>
            <p className="hero__edition">4th Edition</p>
            {settings?.theme && <p className="hero__theme">“{settings.theme}”</p>}

            {settings && <VotingStatusBlock settings={settings} />}

            <div className="hero__actions">
              <Link to="/contestants" className="btn btn--primary">Vote Now</Link>
              <Link to="/results" className="btn btn--secondary">View Results</Link>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="container">
          <ErrorMessage title="System temporarily unavailable">{error}</ErrorMessage>
        </div>
      )}

      <section className="container info-grid">
        <div className="card info-card">
          <h2>How Voting Works</h2>
          <ol>
            <li>Browse contestants and choose who you'd like to support.</li>
            <li>Sign in with your Google account to verify your identity.</li>
            <li>Cast your vote for that contestant.</li>
            <li>Return after midnight East Africa Time to vote again the next day.</li>
          </ol>
        </div>

        <div className="card info-card">
          <h2>Voting Rules</h2>
          <ul>
            <li>One verified email account may vote once per voting day.</li>
            <li>Voting resets automatically at midnight, East Africa Time (Africa/Kampala).</li>
            <li>You do not need to register separately — your Google account is your voter identity.</li>
            <li>Every vote is validated and recorded securely on the server.</li>
          </ul>
        </div>

        <div className="card info-card">
          <h2>Eligibility &amp; Results</h2>
          <ul>
            <li>Any voter with a verified Google account email may participate.</li>
            <li>Overall cumulative results remain confidential while voting is active.</li>
            <li>Final results are published once voting officially closes.</li>
          </ul>
        </div>
      </section>
    </>
  );
}

function VotingStatusBlock({ settings }) {
  if (settings.votingStatus === 'NOT_STARTED') {
    return (
      <div className="hero__status">
        <span className="badge badge--pending">Voting Not Started</span>
        {settings.startDatetime && (
          <Countdown targetIso={settings.startDatetime} label="Voting opens in" />
        )}
      </div>
    );
  }
  if (settings.votingStatus === 'OPEN') {
    return (
      <div className="hero__status">
        <span className="badge badge--open">
          Voting Open · Day {settings.currentVotingDay}
        </span>
        {settings.endDatetime && (
          <Countdown targetIso={settings.endDatetime} label="Voting closes in" />
        )}
      </div>
    );
  }
  return (
    <div className="hero__status">
      <span className="badge badge--closed">Voting Closed</span>
      <p>Thank you to everyone who voted. Final results will be published here.</p>
    </div>
  );
}
