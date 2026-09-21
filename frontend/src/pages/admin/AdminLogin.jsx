import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, ApiError } from '../../api/api.js';
import GoogleSignInButton from '../../components/GoogleSignInButton.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

export default function AdminLogin() {
  const { idToken, isSignedIn, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const [authorized, setAuthorized] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSignedIn || !idToken) {
      setAuthorized(null);
      return;
    }
    setChecking(true);
    setError(null);
    api.adminWhoAmI(idToken)
      .then(() => setAuthorized(true))
      .catch((e) => {
        setAuthorized(false);
        setError(e instanceof ApiError ? e.message : 'Authentication failed.');
      })
      .finally(() => setChecking(false));
  }, [isSignedIn, idToken]);

  if (authorized) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="container page-section admin-login">
      <div className="card admin-login__card">
        <p className="eyebrow">Administrator Access</p>
        <h1>Sign in to the dashboard</h1>
        <p>Access is restricted to authorized Lira University Pageantry administrators.</p>

        {!isSignedIn && <GoogleSignInButton />}

        {checking && <p>Verifying access…</p>}

        {authorized === false && (
          <>
            <ErrorMessage title="Unauthorized access">{error}</ErrorMessage>
            <button className="btn btn--secondary" onClick={signOut}>Try a different account</button>
          </>
        )}
      </div>
    </div>
  );
}
