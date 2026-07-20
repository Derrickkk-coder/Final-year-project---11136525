import client from './client.js'

export async function registerUser(payload) {
  const { data } = await client.post('/auth/register', payload)
  return data // { success, token, user }
}

export async function loginUser(payload) {
  const { data } = await client.post('/auth/login', payload)
  return data // { success, token, user }
}

export async function getMe() {
  const { data } = await client.get('/auth/me')
  return data // { success, user }
}