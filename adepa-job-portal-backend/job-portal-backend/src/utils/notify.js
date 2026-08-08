import Notification from '../models/Notification.js'

// Fire-and-forget, for the same reason the email helpers are: a notification is
// a side effect of a request, never a reason to fail it. Callers deliberately
// don't await these — if writing the notification fails, the status update or
// job posting that triggered it has still succeeded, and that's what matters to
// the person who made the request.

export async function notifyUser({ recipient, type, message, link, job, application }) {
  try {
    await Notification.create({ recipient, type, message, link, job, application })
  } catch (err) {
    console.error('[notify] Could not create notification:', err.message)
  }
}

// One insert for a fan-out (e.g. "new job in a category you've applied to")
// rather than N round trips.
export async function notifyManyUsers(recipients, { type, message, link, job }) {
  if (!recipients || recipients.length === 0) return

  try {
    await Notification.insertMany(
      recipients.map((recipient) => ({ recipient, type, message, link, job }))
    )
    console.log(`[notify] ${recipients.length} notification(s) created (${type})`)
  } catch (err) {
    console.error('[notify] Could not create notifications:', err.message)
  }
}
