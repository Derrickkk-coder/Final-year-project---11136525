import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerUser } from '../api/auth.js'
import { MailIcon, LockIcon, UserIcon, BuildingIcon, AvatarGlyph } from '../components/AuthIcons.jsx'

function getErrorMessage(err) {
  if (!err.response) {
    return "The server is taking longer than usual to respond — it may be waking up from being idle (this can take up to a minute on a free hosting tier). Please wait a few seconds and try again."
  }
  return err.response.data?.message || 'Something went wrong creating your account. Please try again.'
}

function EyeIcon({ off }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <line x1="2" y1="2" x2="22" y2="22" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M16.7 16.7C15.1 17.5 13.6 18 12 18c-7 0-11-7-11-7a19.8 19.8 0 0 1 4.2-5.2" />
          <path d="M9.9 4.2C10.6 4.1 11.3 4 12 4c7 0 11 7 11 7a19.9 19.9 0 0 1-2.6 3.6" />
        </>
      ) : (
        <>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

export default function Register() {
  const [role, setRole] = useState('seeker')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', company: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        company: role === 'employer' ? form.company : undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-done">
          <div className="auth-done__tick" aria-hidden="true">✓</div>
          <h1 className="auth-title">Check your inbox</h1>
          <p className="auth-sub">
            We've sent a verification link to <strong>{form.email}</strong>. Click it to activate
            your account, then come back and log in.
          </p>
          <p style={{ color: 'var(--ink-faint)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
            Don't see it? Check your spam folder — it can take a minute to arrive.
          </p>
          <Link to="/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Go to log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-split">
      <aside className="auth-split__art">
        <div>
          <span className="auth-split__eyebrow">Join NextLeap</span>
          {/* Re-keyed on role so the headline crossfades when the toggle moves */}
          <h2 key={role} className="role-fade">
            {role === 'employer'
              ? 'Post roles. Manage applicants. Hire faster.'
              : 'Search once. Apply everywhere that matters.'}
          </h2>
        </div>
        <ul className="auth-split__points">
          <li>✓ Centralised job listings</li>
          <li>✓ Secure JWT-based authentication</li>
          <li>✓ Track every application in one place</li>
        </ul>
      </aside>

      <div className="auth-split__main">
      <div className="auth-card">
        <div className="auth-badge"><AvatarGlyph /></div>
        <h1 className="auth-title">Sign Up</h1>
        <p className="auth-sub">Create your NextLeap account.</p>

        <div className="auth-roles" role="tablist" aria-label="Account type">
          <div className={`auth-roles__indicator ${role === 'employer' ? 'is-employer' : ''}`} aria-hidden="true" />
          <button type="button" className={role === 'seeker' ? 'active' : ''} onClick={() => setRole('seeker')}>
            Job seeker
          </button>
          <button type="button" className={role === 'employer' ? 'active' : ''} onClick={() => setRole('employer')}>
            Employer
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-row" style={{ '--row': 0 }}>
            <div className="auth-row__head">
              <label htmlFor="name">{role === 'employer' ? 'Your full name' : 'Name'}</label>
            </div>
            <div className="auth-field">
              <span className="auth-field__icon"><UserIcon /></span>
              <input id="name" value={form.name} onChange={update('name')} placeholder="Enter your name" autoComplete="name" />
            </div>
          </div>

          {/* Only employers have a company, so the field collapses away for seekers */}
          <div className={`auth-collapse ${role === 'employer' ? 'is-open' : ''}`}>
            <div className="auth-collapse__inner">
              <div className="auth-row" style={{ '--row': 1 }}>
                <div className="auth-row__head">
                  <label htmlFor="company">Company name</label>
                </div>
                <div className="auth-field">
                  <span className="auth-field__icon"><BuildingIcon /></span>
                  <input id="company" value={form.company} onChange={update('company')} placeholder="e.g. Zaya Health" />
                </div>
              </div>
            </div>
          </div>

          <div className="auth-row" style={{ '--row': 2 }}>
            <div className="auth-row__head">
              <label htmlFor="email">Email</label>
            </div>
            <div className="auth-field">
              <span className="auth-field__icon"><MailIcon /></span>
              <input id="email" type="email" value={form.email} onChange={update('email')} placeholder="Enter your email" autoComplete="email" />
            </div>
          </div>

          <div className="auth-row" style={{ '--row': 3 }}>
            <div className="auth-row__head">
              <label htmlFor="password">Password</label>
            </div>
            <div className="auth-field">
              <span className="auth-field__icon"><LockIcon /></span>
              <input
                id="password"
                className="has-toggle"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="Create a password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
            <span className="hint">At least 8 characters. Hashed with bcrypt before storage.</span>
          </div>

          <div className="auth-row" style={{ '--row': 4 }}>
            <div className="auth-row__head">
              <label htmlFor="confirmPassword">Confirm password</label>
            </div>
            <div className="auth-field">
              <span className="auth-field__icon"><LockIcon /></span>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account? <Link to="/login">Log In &rsaquo;</Link>
        </p>
      </div>
      </div>
    </div>
  )
}
