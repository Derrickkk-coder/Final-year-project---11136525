import React from 'react'

const LABELS = {
  pending: 'Pending review',
  review: 'In review',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Not selected',
  open: 'Open',
  closed: 'Closed',
  approved: 'Approved',
  active: 'Active',
  inactive: 'Deactivated',
}

export default function StatusPill({ status }) {
  const acceptedLike = ['open', 'approved', 'active'].includes(status)
  const rejectedLike = ['closed', 'inactive'].includes(status)
  const modifier = acceptedLike ? 'accepted' : rejectedLike ? 'rejected' : status

  return <span className={`status-pill status-pill--${modifier}`}>{LABELS[status] || status}</span>
}