import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext.jsx'
import timeAgo from '../utils/timeAgo.js'

const TYPE_LABEL = {
  application_status: 'Application update',
  new_matching_job: 'New matching role',
}

// How many to show before "Show all". Keeps the dashboard scannable when
// someone has dozens.
const COLLAPSED_COUNT = 4

// Reads from NotificationsContext rather than fetching for itself, so this and
// the navbar bell are always showing the same thing — marking something read in
// one place updates the other immediately.
export default function NotificationsPanel() {
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications()
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  const handleOpen = (notification) => {
    markRead(notification)
    if (notification.link) navigate(notification.link)
  }

  // Nothing at all and no error — stay out of the way rather than showing an
  // empty box on a brand new account.
  if (!loading && !error && notifications.length === 0) return null

  const visible = expanded ? notifications : notifications.slice(0, COLLAPSED_COUNT)

  return (
    <div className="panel notif-panel">
      <div className="notif-panel__head">
        <div className="notif-panel__title">
          <h2>Notifications</h2>
          {unreadCount > 0 && <span className="notif-badge">{unreadCount} new</span>}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn--ghost btn--sm" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, margin: 0 }}>
          Loading notifications…
        </p>
      )}

      {error && notifications.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, margin: 0 }}>{error}</p>
      )}

      {notifications.length > 0 && (
        <>
          <ul className="notif-list">
            {visible.map((n, i) => (
              <li key={n._id} style={{ '--i': i }}>
                <button
                  type="button"
                  className={`notif-item ${n.isRead ? '' : 'is-unread'}`}
                  onClick={() => handleOpen(n)}
                >
                  <span className="notif-item__dot" aria-hidden="true" />
                  <span className="notif-item__body">
                    <span className="notif-item__meta">
                      {TYPE_LABEL[n.type] || 'Update'} · {timeAgo(n.createdAt)}
                    </span>
                    <span className="notif-item__message">{n.message}</span>
                  </span>
                  {!n.isRead && <span className="notif-item__new">New</span>}
                </button>
              </li>
            ))}
          </ul>

          {notifications.length > COLLAPSED_COUNT && (
            <button
              className="btn btn--ghost btn--sm notif-panel__more"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Show fewer' : `Show all ${notifications.length} notifications`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
