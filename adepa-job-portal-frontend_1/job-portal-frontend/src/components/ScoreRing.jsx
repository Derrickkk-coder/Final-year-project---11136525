import React from 'react'

// Conic-gradient progress ring. One element for the sweep plus one to punch out
// the middle — no SVG, no viewBox arithmetic, and it reads theme tokens directly.
//
// Shared by the profile completion meter and the CV score so a percentage looks
// the same wherever it appears, and the colour thresholds mean one thing across
// the app: green is good from 80, teal is fair from 50, coral needs work.
export function toneForScore(score) {
  if (score >= 80) return 'var(--success)'
  if (score >= 50) return 'var(--teal-500)'
  return 'var(--coral)'
}

export default function ScoreRing({
  value = 0,
  size = 76,
  thickness = 8,
  suffix = '%',
  label,
  ariaLabel,
}) {
  const safe = Math.min(Math.max(Math.round(Number(value) || 0), 0), 100)
  const colour = toneForScore(safe)
  const hole = size - thickness * 2

  return (
    <div
      className="score-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${colour} ${safe * 3.6}deg, var(--line) 0deg)`,
      }}
      role="img"
      aria-label={ariaLabel || `${safe}${suffix}${label ? ` ${label}` : ''}`}
    >
      <div className="score-ring__hole" style={{ width: hole, height: hole }}>
        <span className="score-ring__num" style={{ fontSize: Math.round(size * 0.23) }}>
          {safe}
          {suffix}
        </span>
        {label && <span className="score-ring__label">{label}</span>}
      </div>
    </div>
  )
}
