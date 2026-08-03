import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setSubmitting(true)
    try {
      await forgotPassword(email.trim())
      setSubmitted(true)
    } catch (err) {
      if (!err.response) {
        setError("The server is taking longer than usual to respond — it may be waking up from being idle. Please wait a few seconds and try again.")
      } else {
        setError(err.response.data?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="auth-shell">
        <div className="auth-shell__art">
          <div>
            <span className="hero__eyebrow">Check your inbox</span>
            <h2 style={{ fontSize: 34, marginTop: 12, maxWidth: '16ch' }}>Almost there.</h2>
          </div>
        </div>
        <div className="auth-shell__form">
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Check your email</h1>
          <p style={{ color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 20 }}>
            If an account exists for <strong>{email}</strong>, we've sent a password reset link. Click it to choose a new password.
          </p>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 24 }}>
            Don't see it? Check your spam/junk folder — it can take a minute to arrive.
          </p>
          <Link to="/login" className="btn btn--pine btn--block">Back to log in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__art">
        <div>
          <span className="hero__eyebrow">Forgot password</span>
          <h2 style={{ fontSize: 34, marginTop: 12, maxWidth: '16ch' }}>Let's get you back in.</h2>
        </div>
        <p style={{ color: 'rgba(238,241,236,0.65)', fontSize: 14 }}>
          Enter the email you registered with, and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="auth-shell__form">
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Reset your password</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 28, fontSize: 14 }}>
          Remembered it? <Link to="/login" style={{ color: 'var(--pine)', fontWeight: 600 }}>Log in</Link>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

          <button className="btn btn--pine btn--block" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  )
}