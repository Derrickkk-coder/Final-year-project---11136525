import React, { useEffect, useMemo, useRef, useState } from 'react'

// Single-series area chart, inline SVG, no charting library.
//
// Design notes, each answering a specific failure mode:
//  - One series, so no legend: the card title names it. Labels are selective —
//    only the peak is annotated, never every point.
//  - Gridlines are solid hairlines one shade off the surface. Dashed rules read
//    as "threshold" or "projection" when they are only a grid.
//  - The SVG is sized to real pixels via ResizeObserver rather than scaled with
//    preserveAspectRatio, so the axis text stays at its intended size instead of
//    shrinking with the card.
//  - Height covers plot + axis band, so the card never grows a nested scrollbar.
//  - Hover has a matching keyboard path and a table view underneath: a tooltip is
//    never the only way to read a value.

const PAD = { top: 16, right: 16, bottom: 26, left: 34 }
const HEIGHT = 210
// Minimum comfortable hit target; the invisible hover columns are stretched to
// at least this wide so a value isn't a pinpoint to land on.
const MIN_HIT = 24

function niceMax(value) {
  if (value <= 4) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

function shortDay(date) {
  return new Date(date).toLocaleDateString('en-GB', { weekday: 'short' })
}

function fullDay(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ActivityChart({ series = [], label = 'Activity', unit = 'application' }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(560)
  const [active, setActive] = useState(null)

  // Real pixel width, so text isn't scaled by the viewBox
  useEffect(() => {
    const node = wrapRef.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width)
      if (next > 0) setWidth(next)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const geometry = useMemo(() => {
    const plotW = Math.max(width - PAD.left - PAD.right, 10)
    const plotH = HEIGHT - PAD.top - PAD.bottom
    const max = niceMax(Math.max(...series.map((d) => d.count), 0))
    const step = series.length > 1 ? plotW / (series.length - 1) : 0

    const points = series.map((d, i) => ({
      ...d,
      x: PAD.left + i * step,
      y: PAD.top + plotH - (d.count / max) * plotH,
    }))

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    const area = points.length
      ? `${line} L${points[points.length - 1].x},${PAD.top + plotH} L${points[0].x},${PAD.top + plotH} Z`
      : ''

    // Four bands is enough to read against without crowding the plot
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      value: Math.round(max * t),
      y: PAD.top + plotH - t * plotH,
    }))

    const peak = points.reduce((best, p) => (p.count > (best?.count ?? -1) ? p : best), null)

    return { plotW, plotH, max, step, points, line, area, ticks, peak }
  }, [series, width])

  const { points, line, area, ticks, peak, plotH, step } = geometry
  const shown = active != null ? points[active] : null
  const hitWidth = Math.max(step || MIN_HIT, MIN_HIT)

  return (
    <div className="chart" ref={wrapRef}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`${label}: ${series.reduce((s, d) => s + d.count, 0)} in the last ${series.length} days`}
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Solid hairlines, one shade off the surface */}
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left} y1={tick.y} x2={width - PAD.right} y2={tick.y}
              stroke="var(--line)" strokeWidth="1" shapeRendering="crispEdges"
            />
            <text
              x={PAD.left - 8} y={tick.y + 3.5} textAnchor="end"
              className="chart__tick"
            >
              {tick.value}
            </text>
          </g>
        ))}

        {area && <path d={area} fill="url(#chartFill)" />}
        {line && (
          <path
            d={line} fill="none" stroke="var(--chart-line)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        )}

        {/* Only the peak is labelled — a number on every point goes unread */}
        {peak && peak.count > 0 && active == null && (
          <>
            <circle cx={peak.x} cy={peak.y} r="4.5" fill="var(--chart-line)" stroke="var(--paper-raised)" strokeWidth="2" />
            <text
              x={Math.min(Math.max(peak.x, PAD.left + 12), width - PAD.right - 12)}
              y={peak.y - 12}
              textAnchor="middle"
              className="chart__peak"
            >
              {peak.count}
            </text>
          </>
        )}

        {/* x labels thinned so they never collide at narrow widths */}
        {points.map((p, i) => {
          const every = points.length > 10 ? Math.ceil(points.length / 7) : 1
          if (i % every !== 0 && i !== points.length - 1) return null
          return (
            <text key={p.key} x={p.x} y={HEIGHT - 8} textAnchor="middle" className="chart__tick">
              {shortDay(p.date)}
            </text>
          )
        })}

        {/* Crosshair + marker for the hovered or focused point */}
        {shown && (
          <>
            <line
              x1={shown.x} y1={PAD.top} x2={shown.x} y2={PAD.top + plotH}
              stroke="var(--chart-line)" strokeWidth="1" strokeOpacity="0.4"
            />
            <circle cx={shown.x} cy={shown.y} r="5" fill="var(--chart-line)" stroke="var(--paper-raised)" strokeWidth="2" />
          </>
        )}

        {/* Invisible columns carry hover AND keyboard focus, so both paths show
            the same thing */}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.key}`}
            x={p.x - hitWidth / 2} y={PAD.top}
            width={hitWidth} height={plotH}
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label={`${fullDay(p.date)}: ${p.count} ${unit}${p.count === 1 ? '' : 's'}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
          />
        ))}
      </svg>

      {shown && (
        <div
          className="chart__tip"
          style={{
            left: Math.min(Math.max(shown.x, 60), width - 60),
            top: Math.max(shown.y - 46, 0),
          }}
        >
          <strong>{shown.count}</strong> {unit}{shown.count === 1 ? '' : 's'}
          <span>{fullDay(shown.date)}</span>
        </div>
      )}

      {/* The table-view twin. Every value here is readable without hovering. */}
      <details className="chart__data">
        <summary>View as table</summary>
        <table>
          <thead>
            <tr><th>Day</th><th>{label}</th></tr>
          </thead>
          <tbody>
            {series.map((d) => (
              <tr key={d.key}>
                <td>{fullDay(d.date)}</td>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
