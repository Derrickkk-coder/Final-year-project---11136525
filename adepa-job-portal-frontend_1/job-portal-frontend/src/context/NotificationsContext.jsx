import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications.js'

const NotificationsContext = createContext(null)

// Notifications are created by *other* people's actions — an employer changing
// your application status, a new job being posted — so nothing in this session
// tells us when to re-check. Without a poll the badge would only ever update on
// a full page reload.
const POLL_INTERVAL_MS = 60000

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // `quiet` skips the loading/error states, so a background poll never makes
  // an already-rendered list flicker or show an error over good data.
  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const data = await fetchNotifications()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
      setError('')
    } catch {
      if (!quiet) setError('Could not load your notifications right now.')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  // Load on login, clear on logout.
  //
  // Keyed on user._id rather than the user object: updateUser() replaces that
  // object on every profile save, which would otherwise refetch notifications
  // each time someone edits their bio.
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setError('')
      return
    }
    refresh()
  }, [user?._id, refresh])

  useEffect(() => {
    if (!user) return

    const tick = () => {
      // Don't poll a tab nobody is looking at
      if (document.visibilityState === 'visible') refresh({ quiet: true })
    }

    const interval = setInterval(tick, POLL_INTERVAL_MS)
    // Catch up straight away when the tab comes back into focus, rather than
    // waiting out the remainder of the interval
    document.addEventListener('visibilitychange', tick)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [user?._id, refresh])

  // Takes the notification, not just its id, so the early return makes this
  // idempotent — calling it twice can't decrement the badge twice.
  const markRead = useCallback(async (notification) => {
    if (!notification || notification.isRead) return

    setNotifications((prev) =>
      prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((c) => Math.max(c - 1, 0))

    try {
      const data = await markNotificationRead(notification._id)
      // Prefer the server's count: it also sees unread items older than the
      // 50 we loaded, which our local arithmetic can't know about.
      if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount)
    } catch {
      // Keep the optimistic state; the next poll reconciles it
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      await markAllNotificationsRead()
    } catch {
      // Same as above — the next poll will restore the true state
    }
  }, [])

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, error, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
