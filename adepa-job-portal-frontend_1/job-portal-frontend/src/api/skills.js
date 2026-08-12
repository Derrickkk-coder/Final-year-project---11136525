import client from './client.js'

// jobTitle is optional context for the prompt — see the backend cache, which
// is keyed on the skill alone so this doesn't fragment it per job.
export async function fetchSkillResources(skill, jobTitle) {
  const { data } = await client.post('/skills/resources', { skill, jobTitle })
  return data // { success, resources, cached }
}
