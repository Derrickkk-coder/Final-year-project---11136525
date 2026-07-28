import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { verifyEmail } from '../api/auth.js'

export default function VerifyEmail() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    verifyEmail(token)
      .then((data) => {
        setStatus('success')
        setMessage(data.message)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.message || 'This verification link is invalid or has expired.')
      })
  }, [token])

  return (
    <div className="container" style={{ padding: '100px 24px', textAlign: 'center', maxWidth: 480 }}>
      {status === 'loading' && (
        <>
          <span className="eyebrow">Verifying</span>
          <h1 style={{ fontSize: 26, margin: '12px 0' }}>Confirming your email…</h1>
          <p style={{ color: 'var(--ink-soft)' }}>This will just take a moment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <span className="eyebrow">Verified</span>
          <h1 style={{ fontSize: 26, margin: '12px 0' }}>Your email is confirmed</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>{message}</p>
          <Link to="/login" className="btn btn--pine">Go to log in</Link>
        </>
      )}

      {status === 'error' && (
        <>
          <span className="eyebrow">Link problem</span>
          <h1 style={{ fontSize: 26, margin: '12px 0' }}>We couldn't verify that link</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>{message}</p>
          <Link to="/login" className="btn btn--outline-pine">Back to log in</Link>
        </>
      )}
    </div>
  )
}