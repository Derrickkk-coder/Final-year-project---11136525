import React, { useMemo, useState } from 'react'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Local-date key, deliberately not toISOString().slice(0,10) — that converts to
// UTC first, so an 11pm interview would land on the following day in the grid.
export function dateKey(date) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Always 42 cells (6 rows), including trailing days of the neighbouring months.
// A fixed cell count means the grid doesn't change height between a 28-day
// February and a 31-day month that starts on a Sunday.
function buildCells(year, month) {
  const first = new Date(year, month, 1)
  // Monday-first weeks: shift Sunday (0) to the end
  const lead = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - lead)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { date: d, key: dateKey(d), inMonth: d.getMonth() === month }
  })
}

export default function InterviewCalendar({ interviews = [], selectedKey, onSelectDay }) {
  // Opens on the month of the selected day, so landing on the next upcoming
  // interview doesn't show a month with nothing in it
  const [cursor, setCursor] = useState(() => {
    const base = selectedKey ? new Date(`${selectedKey}T12:00:00`) : new Date()
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  const byDay = useMemo(() => {
    const map = new Map()
    for (const item of interviews) {
      if (!item.interview?.scheduledAt) continue
      const key = dateKey(item.interview.scheduledAt)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    }
    return map
  }, [interviews])

  const cells = useMemo(() => buildCells(cursor.year, cursor.month), [cursor])
  const todayKey = dateKey(new Date())

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  const shiftMonth = (delta) => {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const goToday = () => {
    const now = new Date()
    setCursor({ year: now.getFullYear(), month: now.getMonth() })
    onSelectDay?.(dateKey(now))
  }

  return (
    <div className="cal">
      <div className="cal__head">
        <h2 className="cal__month">{monthLabel}</h2>
        <div className="cal__nav">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={goToday}>Today</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
        </div>
      </div>

      <div className="cal__weekdays" aria-hidden="true">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="cal__grid" role="grid" aria-label={`Interviews in ${monthLabel}`}>
        {cells.map(({ date, key, inMonth }) => {
          const dayInterviews = byDay.get(key) || []
          const classes = [
            'cal__day',
            inMonth ? '' : 'is-outside',
            key === todayKey ? 'is-today' : '',
            key === selectedKey ? 'is-selected' : '',
            dayInterviews.length > 0 ? 'has-items' : '',
          ].filter(Boolean).join(' ')

          return (
            <button
              type="button"
              key={key}
              className={classes}
              onClick={() => onSelectDay?.(key)}
              aria-current={key === todayKey ? 'date' : undefined}
              aria-label={
                `${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}` +
                (dayInterviews.length
                  ? `, ${dayInterviews.length} interview${dayInterviews.length === 1 ? '' : 's'}`
                  : ', no interviews')
              }
            >
              <span className="cal__daynum">{date.getDate()}</span>
              {dayInterviews.length > 0 && (
                <span className="cal__count">
                  {dayInterviews.length}
                  <span className="cal__count-word">
                    {dayInterviews.length === 1 ? ' interview' : ' interviews'}
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
