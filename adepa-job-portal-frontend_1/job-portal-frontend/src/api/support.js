import client from './client.js'

export async function startSupportConversation(payload) {
  const { data } = await client.post('/support/conversations', payload)
  return data // { success, conversation, resumed }
}

export async function fetchMyConversation() {
  const { data } = await client.get('/support/conversations/mine')
  return data // { success, conversation }
}

// `after` is the timestamp of the newest message already held, so only the tail
// travels. Typing state comes back on the same response.
export async function fetchMessages(conversationId, after) {
  const { data } = await client.get(`/support/conversations/${conversationId}/messages`, {
    params: after ? { after } : {},
  })
  return data // { success, messages, conversation }
}

export async function sendSupportMessage(conversationId, body) {
  const { data } = await client.post(`/support/conversations/${conversationId}/messages`, { body })
  return data // { success, message }
}

// Fire-and-forget heartbeat; the response is discarded
export function pingTyping(conversationId) {
  return client.put(`/support/conversations/${conversationId}/typing`).catch(() => {})
}

// ---- Admin ----
export async function fetchSupportConversations(status) {
  const { data } = await client.get('/support/conversations', {
    params: status ? { status } : {},
  })
  return data // { success, conversations, waitingCount }
}

export async function setConversationStatus(conversationId, status) {
  const { data } = await client.put(`/support/conversations/${conversationId}/status`, { status })
  return data // { success, conversation }
}
