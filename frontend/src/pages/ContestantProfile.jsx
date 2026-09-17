import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/api.js';
import ErrorMessage from '../components/ErrorMessage.jsx';

// Short facts shown as labeled rows, in this order. Anything the
// contestant record doesn't have a value for is skipped.
const PROFILE_FACTS = [
  ['Faculty', 'faculty'],
  ['Year of Study', 'yearOfStudy'],
  ['Study Programme', 'studyProgramme']
];

// Longer, paragraph-style answers — each gets its own heading below the
// facts, in this order. Skipped the same way if left blank.
const PROFILE_STATEMENTS = [
  ['My Passion', 'passion'],
  ['What I Believe In', 'beliefs'],
  ['My Platform Intention', 'platformIntention'],
  ['Personal Statement', 'personalStatement']
];

export default function ContestantProfile() {
  const { contestantId } = useParams();
  const [contestant, setContestant] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setContestant(null);
    setError(null);
    api.getContestantDetails(contestantId)
      .then(setContestant)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'System temporarily unavailable.'));
  }, [contestantId]);

  if (error) {
    return (
      <div className="container page-section">
        <ErrorMessage title="Contestant unavailable">{error}</ErrorMessage>
        <Link to="/contestants" className="btn btn--secondary">Back to contestants</Link>
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="container page-section">
        <p>Loading profile…</p>
      </div>
    );
  }

  const facts = PROFILE_FACTS.filter(([, key]) => contestant[key]);
  const statements = PROFILE_STATEMENTS.filter(([, key]) => contestant[key]);

  return (
    <div className="container page-section">
      <Link to="/contestants" className="back-link">&larr; Back to contestants</Link>
      <div className="profile">
        <div className="profile__photo">
          {contestant.photoUrl ? (
            <img src={contestant.photoUrl} alt={`Photograph of ${contestant.name}`} />
          ) : (
            <div className="contestant-card__photo-placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="profile__body">
          <p className="profile__number">Contestant No. {contestant.contestantNumber}</p>
          <h1>{contestant.name}</h1>
          <p className="profile__category">{contestant.category}</p>

          {facts.length > 0 && (
            <dl className="confirmation-list profile__facts">
              {facts.map(([label, key]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{contestant[key]}</dd>
                </div>
              ))}
            </dl>
          )}

          {statements.map(([label, key]) => (
            <div className="profile__statement" key={key}>
              <h3>{label}</h3>
              <p>{contestant[key]}</p>
            </div>
          ))}

          <Link to={`/vote/${contestant.contestantId}`} className="btn btn--primary">
            Add {contestant.name} to Ballot
          </Link>
        </div>
      </div>
    </div>
  );
}
