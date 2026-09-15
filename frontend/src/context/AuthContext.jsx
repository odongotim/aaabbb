import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const STORAGE_KEY = 'lup_id_token';

export function AuthProvider({ children }) {
  const [idToken, setIdToken] = useState(() => sessionStorage.getItem(STORAGE_KEY));
  const [profile, setProfile] = useState(null);
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if (idToken) {
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        setProfile({ email: payload.email, name: payload.name, picture: payload.picture, exp: payload.exp });
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          signOut();
        }
      } catch {
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idToken]);

  useEffect(() => {
    const check = setInterval(() => {
      if (window.google?.accounts?.id) {
        setGsiReady(true);
        clearInterval(check);
      }
    }, 200);
    return () => clearInterval(check);
  }, []);

  const handleCredential = useCallback((response) => {
    sessionStorage.setItem(STORAGE_KEY, response.credential);
    setIdToken(response.credential);
  }, []);

  const initGsi = useCallback(() => {
    if (!window.google?.accounts?.id || !CLIENT_ID || CLIENT_ID.includes('YOUR_GOOGLE')) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredential,
      auto_select: false
    });
  }, [handleCredential]);

  useEffect(() => {
    if (gsiReady) initGsi();
  }, [gsiReady, initGsi]);

  const renderSignInButton = useCallback((el, options = {}) => {
    if (!window.google?.accounts?.id || !el) return;
    window.google.accounts.id.renderButton(el, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'signin_with',
      width: 320,
      ...options
    });
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIdToken(null);
    setProfile(null);
    window.google?.accounts?.id?.disableAutoSelect?.();
  }, []);

  const value = useMemo(
    () => ({ idToken, profile, isSignedIn: !!idToken, gsiReady, renderSignInButton, signOut }),
    [idToken, profile, gsiReady, renderSignInButton, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
