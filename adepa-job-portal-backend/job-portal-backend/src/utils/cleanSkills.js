// Normalises a skills array on the way into the database — used for both the
// seeker's profile skills and a job's required skills, so the two sides of the
// match are always stored the same way.
//
// Trims, collapses inner whitespace, drops blanks, and de-duplicates
// case-insensitively so "Python", "python " and "PYTHON" collapse to one. The
// first spelling wins, since that's the one the user will see rendered back.
export function cleanSkills(skills) {
  if (!Array.isArray(skills)) return []

  const seen = new Set()
  const out = []

  for (const raw of skills) {
    const skill = String(raw || '').trim().replace(/\s+/g, ' ')
    if (!skill) continue

    const key = skill.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    out.push(skill)
  }

  return out
}
