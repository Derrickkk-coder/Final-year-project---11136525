import client from './client.js'

export async function fetchCvAnalysis() {
  const { data } = await client.get('/cv/analysis')
  return data // { success, hasCv, analysis, stale }
}

// Omit jobId for a general review; pass one to also get a CV-to-role comparison.
// force re-runs the analysis instead of serving the cached general review.
export async function analyzeCv({ jobId, force } = {}) {
  const { data } = await client.post('/cv/analyze', { jobId, force })
  return data // { success, analysis, cached }
}
