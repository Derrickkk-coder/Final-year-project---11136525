// Mirror of the rule in the backend's src/utils/studentFriendly.js.
//
// The backend is the source of truth — it decides which jobs the student feed
// actually returns. This copy exists only so a card can explain *why* it's in
// that feed with a badge, without a round trip.
//
// Duplicated rather than shared because the frontend and backend are separate
// npm packages here with no common module. It's deliberately the smallest thing
// worth copying: two enum values and an equality check, over fields already
// present on every job the API returns. If you change the rule, change it in
// both places — the backend one first.
export const STUDENT_JOB_TYPES = ['Internship', 'National Service', 'Graduate trainee']

export const ENTRY_LEVEL = 'Entry level'

export function isStudentFriendly(job) {
  if (!job) return false
  return STUDENT_JOB_TYPES.includes(job.type) || job.experienceLevel === ENTRY_LEVEL
}
