import client from './client.js'

export async function fetchJobs(params = {}) {
  const { data } = await client.get('/jobs', { params })
  return data // { success, jobs, pagination }
}

export async function fetchJobById(id) {
  const { data } = await client.get(`/jobs/${id}`)
  return data // { success, job }
}

export async function fetchMyJobs() {
  const { data } = await client.get('/jobs/mine/list')
  return data // { success, jobs }
}

export async function createJob(payload) {
  const { data } = await client.post('/jobs', payload)
  return data // { success, job }
}

export async function updateJob(id, payload) {
  const { data } = await client.put(`/jobs/${id}`, payload)
  return data // { success, job }
}

export async function deleteJob(id) {
  const { data } = await client.delete(`/jobs/${id}`)
  return data // { success, message }
}