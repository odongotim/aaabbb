import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const profile = useMemo(() => {
    if (!session?.user) return null;
    const meta = session.user.user_metadata || {};
    return {
      email: session.user.email,
      name: meta.full_name || meta.name || '',
      picture: meta.avatar_url || meta.picture || '',
      exp: session.expires_at
    };
  }, [session]);

  // `idToken` is kept as the field name (now holding the Supabase access
  // token) purely so existing pages/components that read it from
  // useAuth() didn't need to change — Supabase RPC calls attach the
  // session automatically and don't actually need this value passed in.
  const value = useMemo(
    () => ({
      idToken: session?.access_token || null,
      profile,
      isSignedIn: !!session,
      gsiReady: ready,
      signInWithGoogle,
      signOut
    }),
    [session, profile, ready, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
