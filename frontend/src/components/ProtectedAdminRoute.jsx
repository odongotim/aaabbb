import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/api.js';

export default function ProtectedAdminRoute({ children }) {
  const { idToken, isSignedIn } = useAuth();
  const [status, setStatus] = useState('checking'); // checking | ok | denied

  useEffect(() => {
    if (!isSignedIn || !idToken) {
      setStatus('denied');
      return;
    }
    let cancelled = false;
    api.adminWhoAmI(idToken)
      .then(() => { if (!cancelled) setStatus('ok'); })
      .catch(() => { if (!cancelled) setStatus('denied'); });
    return () => { cancelled = true; };
  }, [isSignedIn, idToken]);

  if (status === 'checking') {
    return (
      <div className="container page-section">
        <p>Verifying access…</p>
      </div>
    );
  }
  if (status === 'denied') {
    return <Navigate to="/admin" replace />;
  }
  return children;
}
