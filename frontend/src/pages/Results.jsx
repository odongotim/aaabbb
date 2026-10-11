import React from 'react';

// Final totals = all valid votes cast over the whole voting period.
// Source: cumulative total up to 8 Oct 2026 + daily totals for 9, 10 and 11 Oct 2026.
const RESULTS = {
  'Miss Lira University': [
    { contestantId: 'aber', name: 'Aber Mary Josephine', count: 11691 },
    { contestantId: 'kerwegi', name: 'Kerwegi Patience Rudia', count: 10643 },
    { contestantId: 'asiimwe', name: 'Asiimwe Christine', count: 6356 },
  ],
  'Mr Lira University': [
    { contestantId: 'ogangi', name: 'Ogangi Daniel Lawrence', count: 13165 },
    { contestantId: 'achaikimo', name: 'Achaikimo Moses', count: 12683 },
    { contestantId: 'mukisa', name: 'Mukisa Emmanuel', count: 2842 },
  ],
};

// Sort by votes (highest first), then add position and percentage of the category total.
function rank(rows) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return [...rows]
    .sort((a, b) => b.count - a.count)
    .map((r, i) => ({
      ...r,
      position: i + 1,
      percentage: total ? ((r.count / total) * 100).toFixed(1) : '0.0',
    }));
}

export default function Results() {
  return (
    <div className="container page-section">
      <h1>Final Results</h1>
      <p className="page-intro">Lira University Pageantry, 4th Edition — official final results.</p>

      {Object.keys(RESULTS).map((category) => {
        const rows = rank(RESULTS[category]);
        const total = rows.reduce((sum, r) => sum + r.count, 0);
        return (
          <section className="category-section" key={category}>
            <h2 className="category-section__title">{category}</h2>
            <table className="results-table">
              <thead>
                <tr>
                  <th scope="col">Position</th>
                  <th scope="col">Contestant</th>
                  <th scope="col">Total Votes</th>
                  <th scope="col">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.contestantId}>
                    <td>{r.position}</td>
                    <td>{r.name}</td>
                    <td>{r.count.toLocaleString()}</td>
                    <td>{r.percentage}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total votes</td>
                  <td>{total.toLocaleString()}</td>
                  <td>100%</td>
                </tr>
              </tfoot>
            </table>
          </section>
        );
      })}
    </div>
  );
}
