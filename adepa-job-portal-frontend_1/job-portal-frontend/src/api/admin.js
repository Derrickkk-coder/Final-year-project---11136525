import client from './client.js'

export async function fetchEmployers(status) {
  const { data } = await client.get('/admin/employers', { params: status ? { status } : {} })
  return data // { success, employers }
}

export async function approveEmployer(id) {
  const { data } = await client.put(`/admin/employers/${id}/approve`)
  return data // { success, employer }
}

export async function rejectEmployer(id) {
  const { data } = await client.put(`/admin/employers/${id}/reject`)
  return data // { success, employer }
}

export async function fetchAdminStats() {
  const { data } = await client.get('/admin/stats')
  return data // { success, stats }
}

export async function fetchAllUsers(role) {
  const { data } = await client.get('/admin/users', { params: role ? { role } : {} })
  return data // { success, users }
}

export async function setUserActiveStatus(id, isActive) {
  const { data } = await client.put(`/admin/users/${id}/status`, { isActive })
  return data // { success, user }
}

export async function fetchAllJobsAdmin() {
  const { data } = await client.get('/admin/jobs')
  return data // { success, jobs }
}

export async function deleteJobAdmin(id) {
  const { data } = await client.delete(`/admin/jobs/${id}`)
  return data // { success, message }
}