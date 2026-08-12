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

// Appends newly-arrived messages, skipping any whose _id is already present.
//
// The poll and a just-sent message can name the same row twice: the poll asks
// for everything after the last message it knew about, and that "after" is a
// timestamp captured before the send — so if the send's INSERT lands before the
// poll's SELECT runs (both requests are in flight at once, and there's no
// ordering between them), the poll's response includes the very message the
// send handler is about to append itself. Two network round trips, one row,
// both landing in state.
export function mergeMessages(prev, incoming) {
  if (!incoming || incoming.length === 0) return prev
  const known = new Set(prev.map((m) => m._id).filter(Boolean))
  const fresh = incoming.filter((m) => !m._id || !known.has(m._id))
  return fresh.length > 0 ? [...prev, ...fresh] : prev
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
