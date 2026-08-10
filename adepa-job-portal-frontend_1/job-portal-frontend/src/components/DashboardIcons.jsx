import React from 'react'

// Line icons for the dashboard sidebar and stat cards. Inline SVG so they follow
// currentColor through the active/inactive states without a second asset.
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

export const GridIcon = () => (
  <svg {...stroke}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
  </svg>
)

export const PersonIcon = () => (
  <svg {...stroke}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
)

export const BriefcaseIcon = () => (
  <svg {...stroke}>
    <rect x="2.5" y="7" width="19" height="13" rx="2.5" />
    <path d="M8.5 7V5.5A2 2 0 0 1 10.5 3.5h3a2 2 0 0 1 2 2V7" />
  </svg>
)

export const UsersIcon = () => (
  <svg {...stroke}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0" />
    <path d="M16 5.6a3.2 3.2 0 0 1 0 6.3M17.6 14.4a5.4 5.4 0 0 1 3.6 5.1" />
  </svg>
)

export const ChatIcon = () => (
  <svg {...stroke}>
    <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.2A8 8 0 1 1 21 12Z" />
  </svg>
)

export const FileIcon = () => (
  <svg {...stroke}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
)

export const CalendarIcon = () => (
  <svg {...stroke}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </svg>
)

export const SparkIcon = () => (
  <svg {...stroke}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.8L12 18l-1.7-5.5L4.8 10.7 10.3 9Z" />
  </svg>
)

export const EyeIcon = () => (
  <svg {...stroke}>
    <path d="M1.8 12S5.5 5.4 12 5.4 22.2 12 22.2 12 18.5 18.6 12 18.6 1.8 12 1.8 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const CheckIcon = () => (
  <svg {...stroke}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)

export const BookmarkIcon = () => (
  <svg {...stroke}>
    <path d="M6 3.5h12v17l-6-4.2-6 4.2Z" />
  </svg>
)

export const ClockIcon = () => (
  <svg {...stroke}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M12 7.4V12l3.2 2" />
  </svg>
)

export const LogoutIcon = () => (
  <svg {...stroke}>
    <path d="M14 4.5H7.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" />
    <path d="M17.5 8.5 21 12l-3.5 3.5M21 12H10" />
  </svg>
)
