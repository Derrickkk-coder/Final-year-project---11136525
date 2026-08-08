import client from './client.js'

export async function applyToJob(jobId, resumeUrl, phone, contactEmail) {
  const { data } = await client.post('/applications', { jobId, resumeUrl, phone, contactEmail })
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

export async function scheduleInterview(applicationId, payload) {
  const { data } = await client.put(`/applications/${applicationId}/interview`, payload)
  return data // { success, application }
}

export async function analyzeApplication(applicationId, force = false) {
  const { data } = await client.post(`/applications/${applicationId}/analyze`, { force })
  return data // { success, analysis, cached }
}