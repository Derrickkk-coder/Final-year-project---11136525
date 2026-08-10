// Buckets timestamped records into one count per day, for the dashboard activity
// chart. Built from data the page has already fetched — no extra endpoint.

// Local date key, deliberately not toISOString().slice(0,10): that converts to
// UTC first, so a late-evening record would be counted on the following day for
// anyone behind UTC.
function localKey(date) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Returns one bucket per day for the whole window, including empty ones — a line
// that skips silent days would misrepresent the shape of the activity.
export function dailyCounts(items, { days = 14, dateKey = 'createdAt' } = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const buckets = []
  const byKey = new Map()

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const bucket = { key: localKey(date), date, count: 0 }
    buckets.push(bucket)
    byKey.set(bucket.key, bucket)
  }

  for (const item of items || []) {
    const raw = item?.[dateKey]
    if (!raw) continue
    const bucket = byKey.get(localKey(raw))
    if (bucket) bucket.count += 1
  }

  return buckets
}

// A line needs something to describe. Two or three points is a shape read into
// noise, so the caller shows a note instead of a chart below this.
export function activeDayCount(series) {
  return (series || []).filter((b) => b.count > 0).length
}

// Turns a server-supplied [{ day: 'YYYY-MM-DD', count }] list into the same
// shape, so the admin dashboard and the others share one chart component.
export function seriesFromDailyTotals(totals, { days = 14 } = {}) {
  const counts = new Map((totals || []).map((t) => [t.day, t.count]))
  const series = dailyCounts([], { days })
  return series.map((bucket) => ({ ...bucket, count: counts.get(bucket.key) || 0 }))
}
