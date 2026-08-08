import React from 'react'

// Placeholder blocks shown while content loads.
//
// The point of a skeleton over a "Loading…" line is that the page doesn't
// change shape when the data lands — so these deliberately mirror the real
// components' dimensions. If JobCard's layout changes, SkeletonJobCard should
// change with it.
export function Skeleton({ width = '100%', height = 14, radius = 6, style }) {
  return (
    <span
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

// Mirrors .ticket — main column of text on the left, salary + CTA stub right.
export function SkeletonJobCard() {
  return (
    <div className="ticket skeleton-ticket" aria-hidden="true">
      <div className="ticket__main">
        <Skeleton width={72} height={10} />
        <Skeleton width="58%" height={19} style={{ marginTop: 10 }} />
        <Skeleton width="32%" height={13} style={{ marginTop: 8 }} />
        <Skeleton width="44%" height={12} style={{ marginTop: 12 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Skeleton width={78} height={24} radius={999} />
          <Skeleton width={96} height={24} radius={999} />
          <Skeleton width={86} height={24} radius={999} />
        </div>
      </div>
      <div className="ticket__stub">
        <div style={{ width: '100%' }}>
          <Skeleton width={48} height={10} />
          <Skeleton width={104} height={15} style={{ marginTop: 8 }} />
        </div>
        <Skeleton width={68} height={32} radius={999} />
      </div>
    </div>
  )
}

// `count` should match the page's usual result count, so the skeleton occupies
// roughly the height the real list will.
export function SkeletonJobList({ count = 4 }) {
  return (
    <div className="listings-grid" role="status" aria-label="Loading jobs">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonJobCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="stat-grid" role="status" aria-label="Loading figures">
      {Array.from({ length: count }, (_, i) => (
        <div className="stat-card" key={i} aria-hidden="true">
          <Skeleton width={54} height={28} />
          <Skeleton width="72%" height={12} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  )
}

// Generic stand-in for a table or list of rows
export function SkeletonRows({ count = 5, height = 44 }) {
  return (
    <div className="skeleton-rows" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} radius={8} />
      ))}
    </div>
  )
}
