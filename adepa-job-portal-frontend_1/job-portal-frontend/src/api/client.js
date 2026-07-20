import axios from 'axios'

// Points at the Express API. Override with a VITE_API_URL env var if your
// backend runs somewhere other than localhost:5000 (e.g. once deployed to Render).
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('adepa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client