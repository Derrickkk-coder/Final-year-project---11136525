import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Enter both your email and password.')
      return
    }

    setSubmitting(true)
    try {
      const user = await login({ email, password })
      navigate(user.role === 'employer' ? '/employer' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong logging in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__art">
        <div>
          <span className="hero__eyebrow">Welcome back</span>
          <h2 style={{ fontSize: 34, marginTop: 12, maxWidth: '15ch' }}>Find a better way to work.</h2>
          <img
            src="/images/login-illustration.svg"
            alt="Illustration of a laptop with job listings"
            style={{ width: '100%', maxWidth: 320, marginTop: 28 }}
          />
        </div>
        <p style={{ color: 'rgba(238,241,236,0.65)', fontSize: 14 }}>
          "Adepa" — Twi for a good thing. Built as a final year project for the Department of
          Computer Science, University of Ghana.
        </p>
      </div>

      <div className="auth-shell__form">
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Log in</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 28, fontSize: 14 }}>
          New here? <Link to="/register" style={{ color: 'var(--pine)', fontWeight: 600 }}>Create an account</Link>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

          <button className="btn btn--pine btn--block" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}