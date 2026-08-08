import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()

  // Still checking localStorage/token on page load — avoid redirecting
  // a logged-in user just because the check hasn't finished yet.
  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center', color: 'var(--ink-soft)' }}>
        Loading…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // `role` takes a single role or a list of them, for pages shared between roles
  // (the interview calendar serves seekers and employers alike).
  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(user.role)) return <Navigate to="/" replace />
  }

  return children
}