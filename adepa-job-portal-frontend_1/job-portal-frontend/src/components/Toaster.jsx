import React from 'react'
import { useToastState } from '../context/ToastContext.jsx'

const ICONS = {
  success: '✓',
  error: '!',
  info: 'i',
}

// Renders the toast stack. Mounted once, at the app root.
//
// aria-live="polite" so a screen reader announces each toast without cutting off
// whatever it's currently reading — these are confirmations, not alarms.
export default function Toaster() {
  const { toasts, dismiss } = useToastState()

  if (toasts.length === 0) return null

  return (
    <div className="toaster" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          <span className="toast__icon" aria-hidden="true">{ICONS[t.tone] || ICONS.info}</span>
          <span className="toast__message">{t.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
