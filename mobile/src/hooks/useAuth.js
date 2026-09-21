import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { setUser(session?.user ?? null); setLoading(false); }
    });
    supabase.auth.getSession().then(({ data, error: problem }) => {
      if (!active) return;
      if (problem) setError(problem.message);
      setUser(data.session?.user ?? null); setLoading(false);
    }).catch((problem) => { if (active) { setError(problem.message); setLoading(false); } });
    const refresh = (state) => state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh();
    refresh(AppState.currentState);
    const listener = AppState.addEventListener('change', refresh);
    return () => { active = false; subscription.unsubscribe(); listener.remove(); supabase.auth.stopAutoRefresh(); };
  }, []);

  const run = async (action) => {
    setBusy(true); setError('');
    try { await action(); } catch (problem) { setError(problem.message || 'Account request failed.'); }
    finally { setBusy(false); }
  };
  const signIn = () => run(async () => {
    if (!supabase) throw new Error('Configure the Supabase environment variables to enable sign-in.');
    const redirectTo = Platform.OS === 'web' ? window.location.origin : 'myportfoliopsx://auth/callback';
    const { data, error: problem } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
    });
    if (problem) throw problem;
    if (Platform.OS === 'web') return;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return;
    const callback = new URL(result.url);
    if (callback.searchParams.get('error_description')) throw new Error(callback.searchParams.get('error_description'));
    const code = callback.searchParams.get('code');
    if (!code) throw new Error('Sign-in did not return an authorization code.');
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
  });
  const signOut = () => run(async () => {
    const { error: problem } = await supabase.auth.signOut({ scope: 'local' });
    if (problem) throw problem;
  });
  return { user, loading, busy, error, signIn, signOut, configured: Boolean(supabase) };
}
