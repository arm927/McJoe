
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';

export default function Login({ user, onLogin }) {
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isStaff = user && user.role !== 'Customer';
 const from = '/';
  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const success = await onLogin(email, password);

      if (!success) {
        setError('Incorrect email or password.');
      }
    } catch {
      setError('Unable to log in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="container page auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="auth-logo">☕</div>

        <h1>Welcome back</h1>
        <p className="muted">
          Log in to your McJoe account.
        </p>

        <label>
          Email Address
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="Enter your email address"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <span className="error auth-error">{error}</span>
        )}

        <button
          type="submit"
          className="btn btn-primary auth-btn"
          disabled={busy}
        >
          {busy ? 'Logging in...' : 'Log in'}
        </button>

        <p className="muted small auth-switch">
          Don't have an account?{' '}
          <Link className="link" to="/signup">
            Sign up
          </Link>
        </p>
      </form>
    </section>
  );
}
