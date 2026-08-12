import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

// Three states, not two: "system" tracks the OS and moves live if it changes;
// "light" and "dark" are explicit choices that override it. Persisted so a
// choice survives a reload — without that, every visit would start over at
// whatever the OS happens to say.
const STORAGE_KEY = 'nextleap-theme'
const VALID = ['system', 'light', 'dark']

function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return VALID.includes(stored) ? stored : 'system'
  } catch {
    // Private browsing / storage disabled — fall back rather than throw
    return 'system'
  }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStored)

  // The attribute is what tokens.css actually reads. "system" removes it, so the
  // page falls through to the prefers-color-scheme media query; "light" and
  // "dark" pin it regardless of what the OS says. See the CSS for how the three
  // blocks of color values are layered to make that true.
  useEffect(() => {
    if (theme === 'system') {
      delete document.documentElement.dataset.theme
    } else {
      document.documentElement.dataset.theme = theme
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Nothing to fall back to here — the in-memory state still works this visit
    }
  }, [theme])

  // Resolved theme is for the toggle's own icon, so it can show what's actually
  // on screen ("system, currently dark") rather than just the word "system".
  // Re-read on every OS change, but only while the choice is actually "system" —
  // no listener needed once a user has pinned one explicitly.
  const [systemIsDark, setSystemIsDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const sync = () => setSystemIsDark(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const resolvedTheme = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme

  const setTheme = (next) => setThemeState(VALID.includes(next) ? next : 'system')

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
