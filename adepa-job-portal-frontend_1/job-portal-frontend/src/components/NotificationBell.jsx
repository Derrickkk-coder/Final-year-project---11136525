import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext.jsx'
import timeAgo from '../utils/timeAgo.js'

function BellIcon() {
  return (
    <svg
      width="19" height="19" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// Only a handful fit in a dropdown; the dashboard panel is where the full list
// lives, so this links there rather than growing a scroll area.
const DROPDOWN_LIMIT = 6

export default function NotificationBell() {
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  // Close on outside click or Escape. Only listens while open, so there's no
  // document-level handler running for the whole session.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleOpen = (notification) => {
    markRead(notification)
    setOpen(false)
    if (notification.link) navigate(notification.link)
  }

  const visible = notifications.slice(0, DROPDOWN_LIMIT)

  return (
    <div className="nav__bell" ref={wrapRef}>
      <button
        type="button"
        className="bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="bell-btn__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="bell-menu" role="menu">
          <div className="bell-menu__head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="bell-menu__action" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          {loading && notifications.length === 0 && (
            <p className="bell-menu__empty">Loading…</p>
          )}

          {error && notifications.length === 0 && (
            <p className="bell-menu__empty">{error}</p>
          )}

          {!loading && !error && notifications.length === 0 && (
            <p className="bell-menu__empty">
              No notifications yet. We'll let you know when something changes.
            </p>
          )}

          {visible.length > 0 && (
            <ul className="bell-menu__list">
              {visible.map((n) => (
                <li key={n._id}>
                  <button
                    type="button"
                    className={`bell-menu__item ${n.isRead ? '' : 'is-unread'}`}
                    onClick={() => handleOpen(n)}
                  >
                    <span className="bell-menu__dot" aria-hidden="true" />
                    <span className="bell-menu__body">
                      <span className="bell-menu__message">{n.message}</span>
                      <span className="bell-menu__time">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {notifications.length > 0 && (
            <Link to="/dashboard" className="bell-menu__foot" onClick={() => setOpen(false)}>
              View all in dashboard
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
