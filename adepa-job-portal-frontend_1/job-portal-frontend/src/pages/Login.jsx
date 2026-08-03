import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { resendVerification } from '../api/auth.js'

export default function Login() {
  const [searchParams] = useSearchParams()
  const wasDeactivated = searchParams.get('deactivated') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notVerified, setNotVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotVerified(false)
    setResendMessage('')

    if (!email || !password) {
      setError('Enter both your email and password.')
      return
    }

    setSubmitting(true)
    try {
      const user = await login({ email, password })
      navigate(user.role === 'employer' ? '/employer' : '/dashboard')
    } catch (err) {
      if (!err.response) {
        setError("The server is taking longer than usual to respond — it may be waking up from being idle (this can take up to a minute on a free hosting tier). Please wait a few seconds and try again.")
      } else if (err.response.data?.notVerified) {
        setNotVerified(true)
        setError(err.response.data.message)
      } else {
        setError(err.response.data?.message || 'Something went wrong logging in. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendMessage('')
    try {
      const data = await resendVerification(email)
      setResendMessage(data.message)
    } catch (err) {
      setResendMessage(err.response?.data?.message || 'Could not resend the verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__art">
        <div>
          <span className="hero__eyebrow">Welcome back</span>
          <h2 style={{ fontSize: 34, marginTop: 12, maxWidth: '15ch' }}>Find a better way to work.</h2>
        </div>
        <p style={{ color: 'rgba(238,241,236,0.65)', fontSize: 14 }}>
          NextLeap — built as a final year project for the Department of Computer Science,
          University of Ghana.
        </p>
      </div>

      <div className="auth-shell__form">
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Log in</h1>

        {wasDeactivated && (
          <div className="panel" style={{ background: '#FFE9E1', border: '1px solid #F5C4B0', marginBottom: 20, padding: 16 }}>
            <strong style={{ color: 'var(--coral-dark)', fontSize: 14 }}>Your account has been deactivated.</strong>
            <p style={{ color: 'var(--coral-dark)', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
              You've been signed out. Contact support if you believe this is a mistake.
            </p>
          </div>
        )}

        <p style={{ color: 'var(--ink-soft)', marginBottom: 28, fontSize: 14 }}>
          New here? <Link to="/register" style={{ color: 'var(--pine)', fontWeight: 600 }}>Create an account</Link>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" style={{ fontSize: 12.5, color: 'var(--pine)', fontWeight: 600 }}>Forgot password?</Link>
            </div>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

          {notVerified && (
            <div style={{ marginBottom: 18 }}>
              <button
                type="button"
                className="btn btn--outline-pine btn--sm"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
              {resendMessage && <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 10 }}>{resendMessage}</p>}
            </div>
          )}

          <button className="btn btn--pine btn--block" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}