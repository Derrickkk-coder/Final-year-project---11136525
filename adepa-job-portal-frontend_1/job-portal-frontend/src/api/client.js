import axios from 'axios'

// Points at the Express API. Override with a VITE_API_URL env var if your
// backend runs somewhere other than localhost:5000 (e.g. once deployed to Render).
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  // Safety net: if a request ever hangs (network issue, server problem),
  // fail after 20s instead of leaving the UI stuck indefinitely.
  timeout: 20000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('adepa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client