import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../api/api.js';
import { getDeviceHash } from '../api/device.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Vote() {
  const { contestantId } = useParams();
  const navigate = useNavigate();
  const { idToken, profile, isSignedIn, signOut } = useAuth();

  const [contestant, setContestant] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    Promise.all([api.getContestantDetails(contestantId), api.getPublicSettings()])
      .then(([c, s]) => {
        setContestant(c);
        setSettings(s);
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Contestant unavailable.'));
  }, [contestantId]);

  useEffect(() => {
    if (isSignedIn && idToken) {
      api.checkVoterStatus(idToken).then(setVoteStatus).catch(() => {});
    } else {
      setVoteStatus(null);
    }
  }, [isSignedIn, idToken]);

  async function handleVote() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const deviceHash = await getDeviceHash();
      const result = await api.submitVote(idToken, contestantId, deviceHash);
      navigate('/vote-confirmed', { state: result });
    } catch (e) {
      setSubmitError(e instanceof ApiError ? { code: e.code, message: e.message } : { code: 'ERROR', message: 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="container page-section">
        <ErrorMessage title="Contestant unavailable">{loadError}</ErrorMessage>
      </div>
    );
  }

  if (!contestant || !settings) {
    return (
      <div className="container page-section">
        <p>Loading…</p>
      </div>
    );
  }

  if (settings.votingStatus === 'NOT_STARTED') {
    return (
      <div className="container page-section">
        <ErrorMessage title="Voting has not started">
          Voting for the Lira University Pageantry, 4th Edition has not opened yet. Please check back once voting begins.
        </ErrorMessage>
        <Link to="/" className="btn btn--secondary">Return home</Link>
      </div>
    );
  }

  if (settings.votingStatus === 'CLOSED') {
    return (
      <div className="container page-section">
        <ErrorMessage title="Voting has closed">
          Voting for the Lira University Pageantry, 4th Edition has closed. Thank you for participating.
        </ErrorMessage>
        <Link to="/results" className="btn btn--secondary">View results</Link>
      </div>
    );
  }

  return (
    <div className="container page-section vote-page">
      <Link to={`/contestants/${contestant.contestantId}`} className="back-link">&larr; Back to profile</Link>

      <div className="card vote-card">
        <p className="eyebrow">Casting your vote for</p>
        <h1>{contestant.name}</h1>
        <p className="vote-card__meta">Contestant No. {contestant.contestantNumber} · {contestant.category}</p>

        {!isSignedIn && (
          <div className="vote-card__auth">
            <p>Sign in with your Google account to verify your identity and cast your vote.</p>
            <GoogleSignInButton />
          </div>
        )}

        {isSignedIn && voteStatus?.votedToday && (
          <ErrorMessage title="You have already voted today" tone="info">
            You voted for {voteStatus.votedFor} today. You may vote again after midnight, East Africa Time.
          </ErrorMessage>
        )}

        {isSignedIn && voteStatus && !voteStatus.votedToday && (
          <div className="vote-card__confirm">
            <p>Signed in as <strong>{profile?.email}</strong>. <button type="button" className="link-button" onClick={signOut}>Not you?</button></p>
            {submitError && <ErrorMessage title="Vote not recorded">{submitError.message}</ErrorMessage>}
            <button className="btn btn--primary btn--block" onClick={handleVote} disabled={submitting}>
              {submitting ? 'Recording your vote…' : `Confirm Vote for ${contestant.name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
