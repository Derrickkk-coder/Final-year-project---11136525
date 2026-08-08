import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ConfirmContext = createContext(null)

// Promise-based confirmation, so call sites read like the window.confirm they
// replace and stay linear:
//
//   if (!(await confirm({ title: '…', danger: true }))) return
//
// The alternative — a controlled dialog plus a "pending action" state in every
// page — spreads one decision across three pieces of state per call site.
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolver = useRef(null)
  const confirmRef = useRef(null)

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setRequest({
          title: 'Are you sure?',
          body: '',
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          danger: false,
          ...options,
        })
      }),
    []
  )

  const settle = useCallback((result) => {
    resolver.current?.(result)
    resolver.current = null
    setRequest(null)
  }, [])

  useEffect(() => {
    if (!request) return

    // Escape cancels. Focus lands on the confirm button so a keyboard user
    // doesn't have to hunt for it.
    //
    // Note this is not a full focus trap — Tab can still reach the page behind.
    // Adequate for a two-button confirmation; a longer modal would need more.
    const onKeyDown = (e) => {
      if (e.key === 'Escape') settle(false)
    }

    document.addEventListener('keydown', onKeyDown)
    confirmRef.current?.focus()

    // Stop the page scrolling behind the dialog
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [request, settle])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {request && (
        <div
          className="dialog-backdrop"
          // mousedown on the backdrop itself, not a bubbled click from the
          // dialog, so dragging a text selection out of the dialog can't close it
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) settle(false)
          }}
        >
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <h2 className="dialog__title" id="confirm-title">{request.title}</h2>
            {request.body && <p className="dialog__body">{request.body}</p>}

            <div className="dialog__actions">
              <button type="button" className="btn btn--ghost" onClick={() => settle(false)}>
                {request.cancelLabel}
              </button>
              <button
                type="button"
                ref={confirmRef}
                className={`btn ${request.danger ? 'btn--danger' : 'btn--pine'}`}
                onClick={() => settle(true)}
              >
                {request.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
