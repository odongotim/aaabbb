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
        <p className="contestant-card__category">{contestant.category}</p>
        {contestant.biography && (
          <p className="contestant-card__bio">
            {contestant.biography.length > 110
              ? contestant.biography.slice(0, 110).trim() + '…'
              : contestant.biography}
          </p>
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
