import React from 'react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="stripe" role="presentation" aria-hidden="true">
        <span className="stripe__band stripe__band--outer" />
        <span className="stripe__band stripe__band--middle" />
        <span className="stripe__band stripe__band--inner" />
      </div>
      <div className="container site-footer__row">
        <p className="site-footer__text">
          Lira University Pageantry — 4th Edition. Official voting platform. Results remain confidential while voting is active.
        </p>
        <a href="/admin" className="site-footer__admin-link">Administrator sign in</a>
      </div>
    </footer>
  );
}
