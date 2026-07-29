import client from './client.js'

export async function applyToJob(jobId, resumeUrl, phone, contactEmail) {
  const { data } = await client.post('/applications', { jobId, resumeUrl, phone, contactEmail })
  return data
}

export async function fetchMyApplications() {
  const { data } = await client.get('/applications/mine')
  return data
}

export async function fetchApplicationsForEmployer() {
  const { data } = await client.get('/applications/employer')
  return data
}

export async function fetchApplicationsForJob(jobId) {
  const { data } = await client.get(`/applications/job/${jobId}`)
  return data
}

export async function updateApplicationStatus(applicationId, status) {
  const { data } = await client.put(`/applications/${applicationId}/status`, { status })
  return data
}