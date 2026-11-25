
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

export default function Signup({ user, onSignup }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirm: ''
  });

  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '', form: '' }));
  };

  if (user) return <Navigate to="/menu" replace />;

  const submit = async (e) => {
    e.preventDefault();

    const err = {};

    if (!form.name.trim()) {
      err.name = 'Your name is required.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      err.email = 'Enter a valid email address.';
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())) {
      err.username = 'Use 3-20 letters, numbers or underscores.';
    }

    if (form.password.length < 6) {
      err.password = 'Password must have at least 6 characters.';
    }

    if (form.confirm !== form.password) {
      err.confirm = 'Passwords do not match.';
    }

    setErrors(err);

    if (Object.keys(err).length) return;

    setBusy(true);

    try {
      await onSignup({
        name: form.name,
        email: form.email,
        username: form.username,
        password: form.password
      });
    } catch (ex) {
      setErrors({ form: ex.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="container page auth-wrap">
      <form
        className="card auth-card"
        onSubmit={submit}
        noValidate
      >
        <div className="auth-logo">☕</div>

        <h1>Create account</h1>
        <p className="muted">
          Sign up to order from McJoe.
        </p>

        <label>
          Full Name
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </label>

        <label>
          Email Address
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </label>

        <label>
          Username
          <input
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
            placeholder="Create a username"
            autoComplete="username"
            required
          />
          {errors.username && <span className="error">{errors.username}</span>}
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            required
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
            placeholder="Confirm your password"
            autoComplete="new-password"
            required
          />
          {errors.confirm && <span className="error">{errors.confirm}</span>}
        </label>

        {errors.form && (
          <span className="error auth-error">{errors.form}</span>
        )}

        <button
          type="submit"
          className="btn btn-primary auth-btn"
          disabled={busy}
        >
          {busy ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="muted small auth-switch">
          Already have an account?{' '}
          <Link className="link" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </section>
  );
}
