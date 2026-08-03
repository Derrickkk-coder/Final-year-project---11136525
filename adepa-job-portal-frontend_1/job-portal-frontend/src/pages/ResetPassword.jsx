import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { resetPassword } from '../api/auth.js'

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

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError('Please fill in both fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword(token, password)
      setSubmitted(true)
    } catch (err) {
      if (!err.response) {
        setError("The server is taking longer than usual to respond — it may be waking up from being idle. Please wait a few seconds and try again.")
      } else {
        setError(err.response.data?.message || 'This reset link is invalid or has expired.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="container" style={{ padding: '100px 24px', textAlign: 'center', maxWidth: 480 }}>
        <span className="eyebrow">Password updated</span>
        <h1 style={{ fontSize: 26, margin: '12px 0' }}>Your password has been reset</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>You can now log in with your new password.</p>
        <button className="btn btn--pine" onClick={() => navigate('/login')}>Go to log in</button>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: 420 }}>
      <span className="eyebrow">Reset password</span>
      <h1 style={{ fontSize: 26, marginTop: 8, marginBottom: 24 }}>Choose a new password</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="password">New password</label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        <div className="form-field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <div className="password-field">
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
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
          {submitting ? 'Resetting…' : 'Reset password'}
        </button>

        {error?.includes('expired') || error?.includes('invalid') ? (
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 14, textAlign: 'center' }}>
            <Link to="/forgot-password" style={{ color: 'var(--pine)', fontWeight: 600 }}>Request a new reset link</Link>
          </p>
        ) : null}
      </form>
    </div>
  )
}