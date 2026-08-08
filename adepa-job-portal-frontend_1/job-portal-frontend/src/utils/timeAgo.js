// Short relative time — "3h ago" reads faster than a date when scanning a list.
// Falls back to an absolute date past a week, where "34d ago" stops being useful.
//
// Shared by the notification bell and the dashboard panel: they show the same
// timestamps and must format them identically.
export default function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
