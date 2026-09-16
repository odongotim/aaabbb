import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ColorStripe from './ColorStripe.jsx';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__row">
        <Link to="/" className="site-header__brand">
          <img
            src="/lira-university-logo.png"
            alt="Lira University official logo"
            className="site-header__logo"
          />
          <span className="site-header__mark">
            <strong>Lira University</strong>
            <span>Pageantry · 4th Edition</span>
          </span>
        </Link>
        <nav className="site-header__nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/contestants">Contestants</NavLink>
          <NavLink to="/today">Today's Votes</NavLink>
          <NavLink to="/results">Results</NavLink>
        </nav>
      </div>
      <ColorStripe />
    </header>
  );
}
