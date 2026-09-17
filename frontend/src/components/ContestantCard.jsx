import React from 'react';
import { Link } from 'react-router-dom';

export default function ContestantCard({ contestant }) {
  return (
    <article className="card contestant-card">
      <div className="contestant-card__photo">
        {contestant.photoUrl ? (
          <img src={contestant.photoUrl} alt={`Photograph of ${contestant.name}`} loading="lazy" />
        ) : (
          <div className="contestant-card__photo-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="contestant-card__body">
        <p className="contestant-card__number">No. {contestant.contestantNumber}</p>
        <h3 className="contestant-card__name">{contestant.name}</h3>
        {contestant.faculty && (
          <p className="contestant-card__fact"><strong>Faculty:</strong> {contestant.faculty}</p>
        )}
        {contestant.age != null && (
          <p className="contestant-card__fact"><strong>Age:</strong> {contestant.age}</p>
        )}
        <div className="contestant-card__actions">
          <Link to={`/contestants/${contestant.contestantId}`} className="btn btn--secondary">
            View Profile
          </Link>
          <Link to={`/vote/${contestant.contestantId}`} className="btn btn--primary">
            Add to Ballot
          </Link>
        </div>
      </div>
    </article>
  );
}
