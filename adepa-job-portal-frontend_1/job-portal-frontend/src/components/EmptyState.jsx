import React from 'react'

// A blank area should explain itself and offer a way forward, not just state
// that there's nothing here. Every usage passes an action where one exists —
// "no results" should hand you the button that fixes it.
//
// `tone="error"` for failures, so a genuine problem doesn't look like an
// ordinary empty list.
export default function EmptyState({
  icon = '📋',
  title,
  description,
  action,
  tone = 'neutral',
}) {
  return (
    <div className={`empty-state empty-state--${tone}`}>
      <div className="empty-state__icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
