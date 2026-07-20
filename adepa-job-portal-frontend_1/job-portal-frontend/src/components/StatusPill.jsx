import React from 'react'

const LABELS = {
  pending: 'Pending review',
  review: 'In review',
  accepted: 'Accepted',
  rejected: 'Not selected',
  open: 'Open',
  closed: 'Closed',
}

export default function StatusPill({ status }) {
  const modifier = status === 'open' ? 'accepted' : status === 'closed' ? 'rejected' : status
  return <span className={`status-pill status-pill--${modifier}`}>{LABELS[status] || status}</span>
}
