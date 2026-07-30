import axios from 'axios'

// Points at the Express API. Override with a VITE_API_URL env var if your
// backend runs somewhere other than localhost:5000 (e.g. once deployed to Render).
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('adepa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Catches deactivation on ANY request, not just login — so if an admin
// deactivates someone mid-session, their very next action anywhere in the
// app triggers an immediate, clear logout instead of a confusing error.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.accountDeactivated) {
      localStorage.removeItem('adepa_token')
      // Full page navigation (not React Router) so the whole app state resets
      // cleanly, including AuthContext's in-memory user.
      window.location.href = '/login?deactivated=1'
    }
    return Promise.reject(error)
  }
)

export default client