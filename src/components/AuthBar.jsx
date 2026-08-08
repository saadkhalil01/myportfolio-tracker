import { useRef, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';

function GoogleIcon() {
  return (
    <svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function MenuIcon({ type }) {
  const paths = {
    export: <><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 13v6h14v-6" /></>,
    import: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 19h14" /></>,
    reset: <><path d="M4 7v5h5" /><path d="M5.5 16a8 8 0 1 0 .5-9l-2 2" /></>,
    signout: <><path d="M10 5H5v14h5" /><path d="M14 8l4 4-4 4" /><path d="M9 12h9" /></>,
  };
  return <svg className="header-menu-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>;
}

function HeaderActionsMenu({ onExport, onImport, onReset, onSignOut, busy, resetting }) {
  const menuRef = useRef(null);
  const run = (action) => {
    menuRef.current?.removeAttribute('open');
    action?.();
  };

  return (
    <details className="header-menu" ref={menuRef}>
      <summary className="btn header-menu-trigger" aria-label="Open account and portfolio menu">
        <span aria-hidden="true">☰</span>
      </summary>
      <div className="header-menu-panel">
        <button type="button" onClick={() => run(onExport)}>
          <MenuIcon type="export" /> Export portfolio
        </button>
        <button type="button" onClick={() => run(onImport)}>
          <MenuIcon type="import" /> Import portfolio
        </button>
        <button type="button" className="menu-danger" disabled={resetting} onClick={() => run(onReset)}>
          <MenuIcon type="reset" /> Reset portfolio
        </button>
        {onSignOut ? (
          <button type="button" disabled={busy} onClick={() => run(onSignOut)}>
            <MenuIcon type="signout" /> Sign out
          </button>
        ) : null}
      </div>
    </details>
  );
}

export default function AuthBar({ onExport, onImport, onReset, resetting = false }) {
  const { user, loading, configured, signInWithGoogle, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!configured) {
    return (
      <div className="auth-bar">
        <span className="auth-muted">Cloud sync offline</span>
        <HeaderActionsMenu {...{ onExport, onImport, onReset, resetting }} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-bar">
        <span className="auth-muted">Checking account…</span>
        <HeaderActionsMenu {...{ onExport, onImport, onReset, resetting }} />
      </div>
    );
  }

  const handleSignIn = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Sign-in failed');
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setError('');
    try {
      await signOut();
    } catch (err) {
      setError(err.message || 'Sign-out failed');
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
    const avatar = user.user_metadata?.avatar_url;
    return (
      <div className="auth-bar">
        {avatar ? <img className="auth-avatar" src={avatar} alt="" /> : null}
        <span className="auth-user" title={user.email}>
          {name}
        </span>
        <HeaderActionsMenu
          {...{ onExport, onImport, onReset, resetting, busy }}
          onSignOut={handleSignOut}
        />
        {error ? <span className="auth-error">{error}</span> : null}
      </div>
    );
  }

  return (
    <div className="auth-bar">
      <button type="button" className="btn btn-google" disabled={busy} onClick={handleSignIn}>
        <GoogleIcon />
        Sign in with Google
      </button>
      <HeaderActionsMenu {...{ onExport, onImport, onReset, resetting, busy }} />
      {error ? <span className="auth-error">{error}</span> : null}
    </div>
  );
}
