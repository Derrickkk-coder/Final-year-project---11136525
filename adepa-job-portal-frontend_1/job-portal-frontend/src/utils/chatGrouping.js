// iMessage puts the time in a centred separator above a burst of messages rather
// than inside every bubble — so a rapid exchange reads as one conversation
// instead of a column of repeated clocks.
//
// A separator is inserted before the first message, and again whenever there's a
// real pause. An hour is the threshold: shorter than that and the messages are
// clearly the same exchange.
const GAP_MS = 60 * 60 * 1000

function at(message) {
  return new Date(message.createdAt || message.at)
}

export function withTimeSeparators(messages = []) {
  const out = []
  let previous = null

  for (const message of messages) {
    const when = at(message)
    if (!previous || when - previous > GAP_MS) {
      out.push({ separator: true, at: when, key: `sep-${when.getTime()}` })
    }
    out.push(message)
    previous = when
  }

  return out
}

// "TODAY 10:22" / "YESTERDAY 10:22" / "5 APR 10:22" — as iMessage labels them.
export function formatSeparator(date) {
  const d = new Date(date)
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return `Today ${time}`
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`

  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${day} ${time}`
}
