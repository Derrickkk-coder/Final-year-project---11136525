import Notification from '../models/Notification.js'

// Newest 50 is plenty for a dashboard panel — nobody scrolls further back, and
// it keeps the response small on an account with a long history.
const MAX_NOTIFICATIONS = 50

// @route   GET /api/notifications
// @access  Private
// The unread count is returned alongside the list so a badge doesn't need a
// second request, and stays correct even when older unread items fall outside
// the 50 returned.
export async function getMyNotifications(req, res, next) {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(MAX_NOTIFICATIONS),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ])

    res.json({ success: true, notifications, unreadCount })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/notifications/read-all
// @access  Private
export async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    )

    res.json({ success: true, unreadCount: 0 })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/notifications/:id/read
// @access  Private
export async function markAsRead(req, res, next) {
  try {
    // recipient is part of the query rather than checked afterwards: another
    // user's notification id simply doesn't match, so there's no way to mark
    // somebody else's notification read by guessing an id.
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' })
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    })

    res.json({ success: true, notification, unreadCount })
  } catch (err) {
    next(err)
  }
}
