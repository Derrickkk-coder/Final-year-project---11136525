import client from './client.js'

export async function fetchNotifications() {
  const { data } = await client.get('/notifications')
  return data // { success, notifications, unreadCount }
}

export async function markNotificationRead(id) {
  const { data } = await client.put(`/notifications/${id}/read`)
  return data // { success, notification, unreadCount }
}

export async function markAllNotificationsRead() {
  const { data } = await client.put('/notifications/read-all')
  return data // { success, unreadCount }
}
