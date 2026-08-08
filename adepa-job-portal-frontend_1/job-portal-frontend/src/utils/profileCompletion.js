// Profile completeness, as a percentage plus the list of what's still missing.
//
// Weighted rather than a flat count of fields: a CV and skills are what actually
// get someone hired (and skills are what the job match score runs on), so they
// count for more than a location string. Weights total 100.
const CHECKS = [
  { key: 'name', label: 'Full name', weight: 10, done: (u) => Boolean(u.name?.trim()) },
  { key: 'profilePictureUrl', label: 'Profile photo', weight: 10, done: (u) => Boolean(u.profilePictureUrl) },
  { key: 'bio', label: 'Short bio', weight: 10, done: (u) => Boolean(u.bio?.trim()) },
  { key: 'phone', label: 'Phone number', weight: 8, done: (u) => Boolean(u.phone?.trim()) },
  { key: 'location', label: 'Location', weight: 7, done: (u) => Boolean(u.location?.trim()) },
  { key: 'resumeUrl', label: 'CV', weight: 20, done: (u) => Boolean(u.resumeUrl) },
  { key: 'skills', label: 'Skills', weight: 15, done: (u) => (u.skills?.length || 0) > 0 },
  { key: 'education', label: 'Education', weight: 10, done: (u) => (u.education?.length || 0) > 0 },
  { key: 'experience', label: 'Work experience', weight: 7, done: (u) => (u.experience?.length || 0) > 0 },
  { key: 'certifications', label: 'Certifications', weight: 3, done: (u) => (u.certifications?.length || 0) > 0 },
]

export function getProfileCompletion(user) {
  if (!user) return { percent: 0, missing: [], complete: false }

  let earned = 0
  const missing = []

  for (const check of CHECKS) {
    if (check.done(user)) {
      earned += check.weight
    } else {
      missing.push({ key: check.key, label: check.label, weight: check.weight })
    }
  }

  // Heaviest gaps first, so the prompt suggests the most valuable thing to do next
  missing.sort((a, b) => b.weight - a.weight)

  return {
    percent: Math.round(earned),
    missing,
    complete: missing.length === 0,
  }
}
