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
  if (role && user.role !== role) return <Navigate to="/" replace />

  return children
}