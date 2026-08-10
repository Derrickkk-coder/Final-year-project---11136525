import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from './Avatar.jsx'
import NotificationBell from './NotificationBell.jsx'
import { useSidebar } from '../context/SidebarContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // On a dashboard the hamburger opens that page's sidebar instead of the site
  // drawer. The sidebar already holds everything the drawer would have shown a
  // signed-in user — their name, their sections, sign out — so two collapsible
  // menus in the same header would just be one of them being wrong.
  const { present: hasSidebar, open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()
  const drawerOpen = hasSidebar ? sidebarOpen : menuOpen

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="nav">
      <div className="container nav__inner">
        {/* First in the DOM as well as on screen, so tab order matches the
            layout. Hidden above 900px, where the full nav is on show. */}
        <button
          className="nav__burger"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
          aria-controls={hasSidebar ? 'dash-sidebar' : 'nav-mobile-panel'}
          onClick={() => (hasSidebar ? setSidebarOpen(!sidebarOpen) : setMenuOpen((v) => !v))}
        >
          <span className={`nav__burger-line ${drawerOpen ? 'is-open' : ''}`} />
          <span className={`nav__burger-line ${drawerOpen ? 'is-open' : ''}`} />
          <span className={`nav__burger-line ${drawerOpen ? 'is-open' : ''}`} />
        </button>

        <Link to="/" className="nav__brand">
          <img src="/images/logo-mark.png" alt="NextLeap logo" className="nav__brand-mark" />
          NextLeap
        </Link>

        <nav className="nav__links nav__links--desktop">
          {/* Visitors only. It's the point of the site for someone not signed in,
              but nobody with an account belongs on the public board from here: a
              seeker has it in their sidebar, an employer posts vacancies rather
              than shopping for them, and an admin moderates jobs through the
              "All jobs" tab. */}
          {!user && (
            <NavLink to="/jobs" className={({ isActive }) => (isActive ? 'active' : '')}>
              Browse jobs
            </NavLink>
          )}
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
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              Admin dashboard
            </NavLink>
          )}
        </nav>

        {/* One wrapper for everything on the right, so the bell renders once and
            stays visible in both layouts: on desktop the burger is hidden and it
            sits before the avatar; on mobile the actions are hidden and it sits
            beside the burger. A badge inside the collapsed drawer would be
            pointless — you'd have to open the menu to discover you had one. */}
        <div className="nav__right">
          {user && <NotificationBell />}

          <div className="nav__actions nav__actions--desktop">
            {user ? (
              <>
                <Avatar src={user.profilePictureUrl} name={user.name} size={28} />
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
      </div>

      {/* Kept mounted rather than rendered behind `menuOpen &&` so it can animate
          in *and* out — a conditionally rendered panel unmounts the instant the
          state flips, so a closing transition never gets to play.

          While closed it collapses to zero height and goes `visibility: hidden`,
          which also takes the links out of the tab order and hides them from
          screen readers, so keeping them in the DOM costs nothing. The inner
          wrapper exists to carry the drawer's padding away from the element
          doing the clipping — see the overflow note in global.css. */}
      <div
        id="nav-mobile-panel"
        className={`nav__mobile-panel ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="nav__mobile-panel__inner">
          <nav className="nav__mobile-links">
            {/* Mirrors the desktop nav above */}
            {!user && (
              <NavLink to="/jobs" className={({ isActive }) => (isActive ? 'active' : '')}>
                Browse jobs
              </NavLink>
            )}
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
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
                Admin dashboard
              </NavLink>
            )}
          </nav>

          <div className="nav__mobile-actions">
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar src={user.profilePictureUrl} name={user.name} size={28} />
                  <span style={{ fontSize: 13, opacity: 0.75 }}>Signed in as {user.name}</span>
                </div>
                <button className="btn btn--outline-light btn--block" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--outline-light btn--block">
                  Log in
                </Link>
                <Link to="/register" className="btn btn--gold btn--block">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
