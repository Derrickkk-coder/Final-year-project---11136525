import React from 'react'

// Inline SVGs rather than an icon package: five glyphs don't justify a
// dependency, and these inherit currentColor so they follow the field's focus
// and error states for free.

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function MailIcon() {
  return (
    <svg {...base}>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg {...base}>
      <rect x="4" y="10.5" width="16" height="11" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

export function BuildingIcon() {
  return (
    <svg {...base}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10.5 21v-4h3v4" />
    </svg>
  )
}

// The avatar medallion at the top of the card. Filled rather than stroked, so it
// reads as a mark rather than another field icon.
export function AvatarGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M12 14c-4.2 0-7.5 2.6-7.5 5.4 0 .9 4.2.6 7.5.6s7.5.3 7.5-.6c0-2.8-3.3-5.4-7.5-5.4Z" />
    </svg>
  )
}

// Brand marks keep their own colours — a monochrome Google G is unrecognisable,
// and both companies' guidelines require the real thing.
//
// Not imported anywhere yet: social sign-in is deferred. Being unused exports
// they're tree-shaken out of the bundle, so they cost nothing while they wait.
export function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.2C12.3 13.7 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v8.4h12.6c-.3 2.1-1.6 5.2-4.6 7.3l7.7 6c4.6-4.2 6.4-10.3 6.4-17.6Z" />
      <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.6 24c0-1.6.3-3.2.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l7.9-6.2Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.7-5.8l-7.7-6c-2.1 1.4-4.8 2.4-8 2.4-6.3 0-11.7-4.2-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48Z" />
    </svg>
  )
}

export function FacebookIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"
      />
    </svg>
  )
}
