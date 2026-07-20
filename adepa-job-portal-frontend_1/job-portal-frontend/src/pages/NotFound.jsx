import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
      <span className="eyebrow">404 error</span>
      <h1 style={{ fontSize: 32, margin: '12px 0' }}>This page doesn't exist</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn--pine">Back to home</Link>
    </div>
  )
}
