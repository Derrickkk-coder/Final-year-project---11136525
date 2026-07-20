import client from './client.js'

export async function applyToJob(jobId, coverLetter = '') {
  const { data } = await client.post('/applications', { jobId, coverLetter })
  return data // { success, application }
}

export async function fetchMyApplications() {
  const { data } = await client.get('/applications/mine')
  return data // { success, applications }
}

export async function fetchApplicationsForEmployer() {
  const { data } = await client.get('/applications/employer')
  return data // { success, applications }
}

export async function fetchApplicationsForJob(jobId) {
  const { data } = await client.get(`/applications/job/${jobId}`)
  return data // { success, applications }
}

export async function updateApplicationStatus(applicationId, status) {
  const { data } = await client.put(`/applications/${applicationId}/status`, { status })
  return data // { success, application }
}