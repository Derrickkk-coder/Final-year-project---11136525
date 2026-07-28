import client from './client.js'

export async function registerUser(payload) {
  const { data } = await client.post('/auth/register', payload)
  return data // { success, message } — no token yet, account must be verified first
}

export async function loginUser(payload) {
  const { data } = await client.post('/auth/login', payload)
  return data // { success, token, user }
}

export async function getMe() {
  const { data } = await client.get('/auth/me')
  return data // { success, user }
}

export async function verifyEmail(token) {
  const { data } = await client.get(`/auth/verify-email/${token}`)
  return data // { success, message }
}

export async function resendVerification(email) {
  const { data } = await client.post('/auth/resend-verification', { email })
  return data // { success, message }
}

export async function updateProfile(payload) {
  const { data } = await client.put('/auth/profile', payload)
  return data // { success, user }
}