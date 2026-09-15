import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function GoogleSignInButton() {
  const ref = useRef(null);
  const { renderSignInButton, gsiReady, isSignedIn } = useAuth();

  useEffect(() => {
    if (gsiReady && ref.current && !isSignedIn) {
      renderSignInButton(ref.current);
    }
  }, [gsiReady, isSignedIn, renderSignInButton]);

  if (isSignedIn) return null;

  return (
    <div className="google-signin">
      <div ref={ref} />
      {!gsiReady && <p className="google-signin__loading">Loading sign-in…</p>}
    </div>
  );
}
