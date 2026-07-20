import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link to="/" className="nav__brand">
          <span className="nav__brand-mark">N</span>
          NextLeap
        </Link>

        <nav className="nav__links">
          <NavLink to="/jobs" className={({ isActive }) => (isActive ? 'active' : '')}>
            Browse jobs
          </NavLink>
          {user?.role === 'employer' && (
            <NavLink to="/employer" className={({ isActive }) => (isActive ? 'active' : '')}>
              Employer dashboard
            </NavLink>
          )}
          {user?.role === 'seeker' && (
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              My applications
            </NavLink>
          )}
        </nav>

        <div className="nav__actions">
          {user ? (
            <>
              <span style={{ fontSize: 13, opacity: 0.75 }}>{user.name}</span>
              <button className="btn btn--outline-light btn--sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--outline-light btn--sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn--gold btn--sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
