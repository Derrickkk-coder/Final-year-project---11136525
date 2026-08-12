import React from 'react'
import { useTheme } from '../context/ThemeContext.jsx'

const stroke = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const SunIcon = () => (
  <svg {...stroke}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
  </svg>
)

const MoonIcon = () => (
  <svg {...stroke}>
    <path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a6.8 6.8 0 0 0 10.2 10.2Z" />
  </svg>
)

// A monitor rather than a half-sun/half-moon glyph — "system" is a distinct
// third state, not a blend of the other two, and the icon should say so.
const SystemIcon = () => (
  <svg {...stroke}>
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M8.5 20h7M12 16.5V20" />
  </svg>
)

const NEXT = { system: 'light', light: 'dark', dark: 'system' }
const LABEL = { system: 'Matching system', light: 'Light', dark: 'Dark' }
const ICON = { system: SystemIcon, light: SunIcon, dark: MoonIcon }

// One button, three states, cycling on click — system → light → dark → system.
// Shows the *current choice*, not the resolved appearance, so clicking is
// predictable: the icon always tells you what you're about to leave, not a
// blend of what's currently rendered. A dropdown would say the same thing with
// more markup and a second tap to close it; a single cycling button fits the
// same space as any other icon-only control in this header, on a phone or not.
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = ICON[theme]

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Appearance: ${LABEL[theme]}. Click to change.`}
      title={`Appearance: ${LABEL[theme]}`}
    >
      <Icon />
    </button>
  )
}
