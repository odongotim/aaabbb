import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../api/api.js';
import ContestantCard from '../components/ContestantCard.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Contestants() {
  const [contestants, setContestants] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPublicBootstrap()
      .then(({ contestants }) => setContestants(contestants))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'System temporarily unavailable.'));
  }, []);

  if (error) {
    return (
      <div className="container page-section">
        <ErrorMessage title="Unable to load contestants">{error}</ErrorMessage>
      </div>
    );
  }

  if (!contestants) {
    return (
      <div className="container page-section">
        <p>Loading contestants…</p>
      </div>
    );
  }

  const female = contestants.filter((c) => c.category === 'Female');
  const male = contestants.filter((c) => c.category === 'Male');

  return (
    <div className="container page-section">
      <h1>Contestants</h1>
      <p className="page-intro">Browse this year's contestants and cast your vote.</p>

      <CategorySection title="Female" contestants={female} />
      <CategorySection title="Male" contestants={male} />
    </div>
  );
}

function CategorySection({ title, contestants }) {
  if (contestants.length === 0) return null;
  return (
    <section className="category-section">
      <h2 className="category-section__title">{title}</h2>
      <div className="contestant-grid">
        {contestants.map((c) => (
          <ContestantCard key={c.contestantId} contestant={c} />
        ))}
      </div>
    </section>
  );
}
