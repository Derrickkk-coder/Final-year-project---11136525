import client from './client.js'

// Public — no token needed. Feeds the landing page counters.
export async function fetchPublicStats() {
  const { data } = await client.get('/stats')
  return data // { success, stats: { openJobs, seekers, employers, successfulApplications } }
}
