import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/auth.js'

function getErrorMessage(err) {
  if (!err.response) {
    return "The server is taking longer than usual to respond — it may be waking up from being idle (this can take up to a minute on a free hosting tier). Please wait a few seconds and try again."
  }
  return err.response.data?.message || 'Something went wrong creating your account. Please try again.'
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="2" x2="22" y2="22"></line>
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
      <path d="M16.7 16.7C15.1 17.5 13.6 18 12 18c-7 0-11-7-11-7a19.8 19.8 0 0 1 4.2-5.2"></path>
      <path d="M9.9 4.2C10.6 4.1 11.3 4 12 4c7 0 11 7 11 7a19.9 19.9 0 0 1-2.6 3.6"></path>
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
  const navigate = useNavigate()

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
      <div className="auth-shell">
        <div className="auth-shell__art">
          <div>
            <span className="hero__eyebrow">Almost there</span>
            <h2 style={{ fontSize: 34, marginTop: 12, maxWidth: '16ch' }}>Check your inbox to activate your account.</h2>
          </div>
        </div>
        <div className="auth-shell__form">
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Verify your email</h1>
          <p style={{ color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 20 }}>
            We've sent a verification link to <strong>{form.email}</strong>. Click the link in that email to
            activate your account, then come back and log in.
          </p>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 24 }}>
            Don't see it? Check your spam/junk folder — it can take a minute to arrive.
          </p>
          <Link to="/login" className="btn btn--pine btn--block">Go to log in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__art">
        <div>
          <span className="hero__eyebrow">Join NextLeap</span>
          <h2 style={{ fontSize: 34, marginTop: 12, maxWidth: '16ch' }}>
            {role === 'employer' ? 'Post roles. Manage applicants. Hire faster.' : 'Search once. Apply everywhere that matters.'}
          </h2>
        </div>
        <ul style={{ color: 'rgba(238,241,236,0.75)', fontSize: 14, lineHeight: 2, listStyle: 'none', padding: 0 }}>
          <li>✓ Centralised job listings</li>
          <li>✓ Secure JWT-based authentication</li>
          <li>✓ Track every application in one place</li>
        </ul>
      </div>

      <div className="auth-shell__form">
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Create your account</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 28, fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--pine)', fontWeight: 600 }}>Log in</Link>
        </p>

        <div className="role-toggle" role="tablist" aria-label="Account type">
          <button type="button" className={role === 'seeker' ? 'active' : ''} onClick={() => setRole('seeker')}>
            Job seeker
          </button>
          <button type="button" className={role === 'employer' ? 'active' : ''} onClick={() => setRole('employer')}>
            Employer
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">{role === 'employer' ? 'Your full name' : 'Full name'}</label>
            <input id="name" value={form.name} onChange={update('name')} placeholder="e.g. Ama Serwaa" />
          </div>

          {role === 'employer' && (
            <div className="form-field">
              <label htmlFor="company">Company name</label>
              <input id="company" value={form.company} onChange={update('company')} placeholder="e.g. Zaya Health" />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <span className="hint">Will be hashed with bcrypt before storage.</span>
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="password-field">
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

          <button className="btn btn--pine btn--block" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : `Create ${role === 'employer' ? 'employer' : 'job seeker'} account`}
          </button>
        </form>
      </div>
    </div>
  )
}