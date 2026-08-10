import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { resendVerification } from '../api/auth.js'
import roleHome from '../utils/roleHome.js'
import { MailIcon, LockIcon, AvatarGlyph } from '../components/AuthIcons.jsx'

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

export default function Login() {
  const [searchParams] = useSearchParams()
  const wasDeactivated = searchParams.get('deactivated') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      navigate(roleHome(user.role))
    } catch (err) {
      if (!err.response) {
        // No response at all — most commonly a Render free-tier cold start
        // taking longer than usual, not a genuine failure.
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
    <div className="auth-split">
      <aside className="auth-split__art">
        <div>
          <span className="auth-split__eyebrow">Welcome back</span>
          <h2>Find a better way to work.</h2>
        </div>
        <p className="auth-split__note">
          NextLeap — built as a final year project for the Department of Computer Science,
          University of Ghana.
        </p>
      </aside>

      <div className="auth-split__main">
      <div className="auth-card">
        <div className="auth-badge"><AvatarGlyph /></div>
        <h1 className="auth-title">Log in</h1>
        <p className="auth-sub">Welcome back to NextLeap.</p>

        {wasDeactivated && (
          <div className="auth-error">
            <strong>Your account has been deactivated.</strong> You've been signed out. Contact
            support if you believe this is a mistake.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-row" style={{ '--row': 0 }}>
            <div className="auth-row__head">
              <label htmlFor="email">Email</label>
            </div>
            <div className="auth-field">
              <span className="auth-field__icon"><MailIcon /></span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-row" style={{ '--row': 1 }}>
            <div className="auth-row__head">
              <label htmlFor="password">Password</label>
              {/* Kept alongside Password rather than Email as in the reference —
                  it's the password you've forgotten */}
              <Link to="/forgot-password" className="auth-row__aside">Forgot password?</Link>
            </div>
            <div className="auth-field">
              <span className="auth-field__icon"><LockIcon /></span>
              <input
                id="password"
                className="has-toggle"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
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
          </div>

          {error && <p className="auth-error">{error}</p>}

          {notVerified && (
            <div className="auth-notice">
              <button
                type="button"
                className="btn btn--outline-teal btn--sm"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
              {resendMessage && <p style={{ margin: '10px 0 0', fontSize: 'var(--text-sm)' }}>{resendMessage}</p>}
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="auth-foot">
          Not registered yet? <Link to="/register">Sign Up &rsaquo;</Link>
        </p>
      </div>
      </div>
    </div>
  )
}
