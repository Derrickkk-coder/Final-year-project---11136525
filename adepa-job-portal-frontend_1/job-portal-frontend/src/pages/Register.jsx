import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/auth.js'

function getErrorMessage(err) {
  if (!err.response) {
    return "The server is taking longer than usual to respond — it may be waking up from being idle (this can take up to a minute on a free hosting tier). Please wait a few seconds and try again."
  }
  return err.response.data?.message || 'Something went wrong creating your account. Please try again.'
}

export default function Register() {
  const [role, setRole] = useState('seeker')
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
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
            {role === 'employer' && <span className="hint">Please use your company email, not a personal Gmail/Yahoo address.</span>}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={form.password} onChange={update('password')} placeholder="At least 8 characters" />
            <span className="hint">Will be hashed with bcrypt before storage.</span>
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