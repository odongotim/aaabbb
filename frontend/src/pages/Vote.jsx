import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../api/api.js';
import { getDeviceHash } from '../api/device.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const CATEGORIES = ['Female', 'Male'];

export default function Vote() {
  // Preselects a contestant when arriving via a specific contestant's
  // "Vote" link (e.g. /vote/c_123); the rest of the ballot still loads
  // so the person can pick the other category in the same step.
  const { contestantId: preselectId } = useParams();
  const navigate = useNavigate();
  const { idToken, profile, isSignedIn, signOut } = useAuth();

  const [contestants, setContestants] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [votedCategories, setVotedCategories] = useState({});
  const [selections, setSelections] = useState({ Female: null, Male: null });
  const [preselectApplied, setPreselectApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Contestant list + voting window status load immediately and in
  // parallel — no sign-in required to browse and pick, only to submit.
  useEffect(() => {
    Promise.all([api.getActiveContestants(), api.getPublicSettings()])
      .then(([c, s]) => {
        setContestants(c);
        setSettings(s);
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Unable to load the ballot.'));
  }, []);

  // Once signed in, a single call returns today's status for both
  // categories at once (rather than one round trip per category).
  useEffect(() => {
    if (isSignedIn && idToken) {
      api.checkVoterStatus(idToken).then((status) => {
        setVotedCategories(status.votedCategories || {});
      }).catch(() => {});
    } else {
      setVotedCategories({});
    }
  }, [isSignedIn, idToken]);

  useEffect(() => {
    if (preselectApplied || !preselectId || !contestants) return;
    const match = contestants.find((c) => c.contestantId === preselectId);
    if (match) {
      setSelections((prev) => ({ ...prev, [match.category]: match.contestantId }));
    }
    setPreselectApplied(true);
  }, [preselectId, contestants, preselectApplied]);

  const byCategory = useMemo(() => {
    const grouped = { Female: [], Male: [] };
    (contestants || []).forEach((c) => {
      if (grouped[c.category]) grouped[c.category].push(c);
    });
    return grouped;
  }, [contestants]);

  const pendingCategories = CATEGORIES.filter((cat) => !votedCategories[cat]?.voted && selections[cat]);
  const canSubmit = isSignedIn && pendingCategories.length > 0 && !submitting;

  function selectContestant(category, contestantId) {
    if (votedCategories[category]?.voted) return;
    setSelections((prev) => ({ ...prev, [category]: prev[category] === contestantId ? null : contestantId }));
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const deviceHash = await getDeviceHash();
      const picks = {
        femaleContestantId: pendingCategories.includes('Female') ? selections.Female : undefined,
        maleContestantId: pendingCategories.includes('Male') ? selections.Male : undefined
      };
      const result = await api.submitVotes(idToken, picks, deviceHash);
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
        <ErrorMessage title="Ballot unavailable">{loadError}</ErrorMessage>
      </div>
    );
  }

  if (!contestants || !settings) {
    return (
      <div className="container page-section">
        <p>Loading ballot…</p>
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

  const bothAlreadyVoted = votedCategories.Female?.voted && votedCategories.Male?.voted;

  return (
    <div className="container page-section vote-page">
      <h1>Cast Your Ballot</h1>
      <p className="page-intro">Pick one Female contestant and one Male contestant, then submit both votes at once.</p>

      {bothAlreadyVoted ? (
        <ErrorMessage title="You've already voted today in both categories" tone="info">
          You voted for {votedCategories.Female.votedFor} (Female) and {votedCategories.Male.votedFor} (Male) today.
          Come back after midnight, East Africa Time, to vote again.
        </ErrorMessage>
      ) : (
        <>
          {CATEGORIES.map((category) => (
            <BallotSection
              key={category}
              category={category}
              contestants={byCategory[category]}
              selectedId={selections[category]}
              votedEntry={votedCategories[category]}
              onSelect={(id) => selectContestant(category, id)}
            />
          ))}

          <div className="card ballot-submit">
            {!isSignedIn && (
              <div className="vote-card__auth">
                <p>Sign in with your Google account to verify your identity and submit your ballot.</p>
                <GoogleSignInButton />
              </div>
            )}

            {isSignedIn && (
              <p className="ballot-submit__account">
                Signed in as <strong>{profile?.email}</strong>. <button type="button" className="link-button" onClick={signOut}>Not you?</button>
              </p>
            )}

            {submitError && <ErrorMessage title="Vote not recorded">{submitError.message}</ErrorMessage>}

            <button className="btn btn--primary btn--block" onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? 'Recording your votes…' : 'Submit My Votes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function BallotSection({ category, contestants, selectedId, votedEntry, onSelect }) {
  if (!contestants || contestants.length === 0) return null;

  return (
    <section className="category-section">
      <h2 className="category-section__title">{category}</h2>

      {votedEntry?.voted ? (
        <ErrorMessage title={`You already voted in the ${category} category today`} tone="info">
          You voted for {votedEntry.votedFor} today. Come back after midnight, East Africa Time, to vote in this category again.
        </ErrorMessage>
      ) : (
        <div className="contestant-grid ballot-grid" role="radiogroup" aria-label={`${category} contestants`}>
          {contestants.map((c) => {
            const selected = selectedId === c.contestantId;
            return (
              <article
                key={c.contestantId}
                className={`card contestant-card ballot-tile${selected ? ' ballot-tile--selected' : ''}`}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => onSelect(c.contestantId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(c.contestantId);
                  }
                }}
              >
                <div className="contestant-card__photo">
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt={`Photograph of ${c.name}`} loading="lazy" decoding="async" />
                  ) : (
                    <div className="contestant-card__photo-placeholder" aria-hidden="true" />
                  )}
                  {selected && <span className="ballot-tile__check" aria-hidden="true">✓</span>}
                </div>
                <div className="contestant-card__body">
                  <p className="contestant-card__number">No. {c.contestantNumber}</p>
                  <h3 className="contestant-card__name">{c.name}</h3>
                  <Link
                    to={`/contestants/${c.contestantId}`}
                    className="ballot-tile__profile-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View profile
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
