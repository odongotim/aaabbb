import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function GoogleSignInButton() {
  const { signInWithGoogle, isSignedIn, gsiReady } = useAuth();

  if (isSignedIn) return null;

  return (
    <div className="google-signin">
      <button
        type="button"
        className="btn btn--secondary google-signin__button"
        onClick={signInWithGoogle}
        disabled={!gsiReady}
      >
        Sign in with Google
      </button>
      {!gsiReady && <p className="google-signin__loading">Loading sign-in…</p>}
    </div>
  );
}
