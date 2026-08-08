import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

const DEFAULT_DURATION_MS = 4500
// Beyond a few, a stack stops being readable and starts covering the page
const MAX_VISIBLE = 4

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())
  const nextId = useRef(1)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))

    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, { tone = 'info', duration = DEFAULT_DURATION_MS } = {}) => {
      if (!message) return

      const id = nextId.current++

      setToasts((prev) => {
        const next = [...prev, { id, message, tone }]
        // Drop the oldest rather than the newest — the most recent message is
        // the one that relates to what the user just did.
        return next.slice(-MAX_VISIBLE)
      })

      if (duration > 0) {
        timers.current.set(id, setTimeout(() => dismiss(id), duration))
      }

      return id
    },
    [dismiss]
  )

  // Errors stay up longer: they usually need reading, and sometimes acting on.
  const toast = useRef({
    success: (message, opts) => push(message, { ...opts, tone: 'success' }),
    error: (message, opts) => push(message, { tone: 'error', duration: 7000, ...opts }),
    info: (message, opts) => push(message, { ...opts, tone: 'info' }),
  }).current

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}

// For the Toaster component itself, which needs the list as well as the actions
export function useToastState() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastState must be used within ToastProvider')
  return ctx
}
