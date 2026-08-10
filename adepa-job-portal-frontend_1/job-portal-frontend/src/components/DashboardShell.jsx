import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from './Avatar.jsx'
import { getProfileCompletion } from '../utils/profileCompletion.js'
import {
  GridIcon, PersonIcon, BriefcaseIcon, UsersIcon, ChatIcon,
  FileIcon, CalendarIcon, SparkIcon, LogoutIcon,
} from './DashboardIcons.jsx'

// The shared frame for every dashboard: a soft page ground, one rounded shell,
// and a sidebar carrying identity, navigation, and the sign-out.
//
// Navigation is derived from the role rather than repeated in each page, so a
// seeker and an employer can't drift out of sync — previously each page hand-rolled
// its own <aside> and they had already diverged.
//
// `tabs` lets a page put its own in-page sections (Applicants, All jobs, Comments)
// into the same list as the route links, since to the reader they are the same
// kind of thing.
const NAV = {
  seeker: [
    { to: '/dashboard', label: 'Dashboard', icon: GridIcon },
    { to: '/jobs', label: 'Browse jobs', icon: BriefcaseIcon },
    { to: '/interviews', label: 'Interviews', icon: CalendarIcon },
    { to: '/cv-review', label: 'CV review', icon: SparkIcon },
    { to: '/profile', label: 'My profile', icon: PersonIcon },
  ],
  employer: [
    { to: '/employer', label: 'Dashboard', icon: GridIcon },
    { to: '/employer/post', label: 'Post a job', icon: FileIcon },
    { to: '/interviews', label: 'Interviews', icon: CalendarIcon },
    { to: '/employer/profile', label: 'Company profile', icon: PersonIcon },
  ],
  // /admin is the only route an admin can reach that renders this shell, so a
  // link to it would always point at the page they're already on — and it would
  // sit lit up next to whichever tab was actually showing, giving two active
  // items at once. AdminDashboard supplies its overview as a `tabs` entry instead.
  admin: [],
}

export default function DashboardShell({
  title,
  eyebrow,
  actions,
  tabs = [],
  activeTab,
  onTabChange,
  children,
}) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  const links = NAV[user?.role] || []
  // Only seekers have a profile to complete — an employer's completeness isn't
  // measured, so showing them a meter would be inventing a number.
  const completion = user?.role === 'seeker' ? getProfileCompletion(user) : null

  return (
    <div className="dash">
      <div className="dash__shell">
        <aside className="dash__side">
          <div className="dash__who">
            <Avatar src={user?.profilePictureUrl} name={user?.name} size={54} />
            <strong>{user?.name}</strong>
            <span>{user?.role === 'seeker' ? 'Job seeker' : user?.role === 'employer' ? 'Employer' : 'Administrator'}</span>
          </div>

          <nav className="dash__nav">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={`dash__nav-item ${pathname === to ? 'is-active' : ''}`}>
                <Icon /> {label}
              </Link>
            ))}

            {/* In-page sections, presented alongside the route links */}
            {tabs.map(({ key, label, icon: Icon = ChatIcon, badge }) => (
              <button
                type="button"
                key={key}
                className={`dash__nav-item ${activeTab === key ? 'is-active' : ''}`}
                onClick={() => onTabChange?.(key)}
              >
                <Icon /> {label}
                {badge > 0 && <span className="dash__nav-badge">{badge}</span>}
              </button>
            ))}
          </nav>

          <div className="dash__side-foot">
            {completion && (
              <Link to="/profile" className="dash__meter">
                <span className="dash__meter-top">
                  <strong>{completion.percent}%</strong>
                  <span>Profile complete</span>
                </span>
                <span className="dash__meter-track">
                  <span className="dash__meter-fill" style={{ width: `${completion.percent}%` }} />
                </span>
              </Link>
            )}

            <button type="button" className="dash__nav-item dash__logout" onClick={logout}>
              <LogoutIcon /> Log out
            </button>
          </div>
        </aside>

        <div className="dash__main">
          <header className="dash__head">
            <div>
              {eyebrow && <span className="eyebrow">{eyebrow}</span>}
              <h1 className="dash__title">{title}</h1>
            </div>
            {actions && <div className="dash__actions">{actions}</div>}
          </header>

          {children}
        </div>
      </div>
    </div>
  )
}

// Stat tile. The number IS the chart here — a one-bar bar chart would be worse.
// Proportional figures, not tabular: equal-width digits make a large number look
// loose.
export function StatCard({ value, label, icon: Icon, tone = 'lime' }) {
  return (
    <div className="stat">
      <div className="stat__text">
        <span className="stat__num">{value}</span>
        <span className="stat__label">{label}</span>
      </div>
      {Icon && <span className={`stat__icon is-${tone}`}><Icon /></span>}
    </div>
  )
}
