// Skill-based job matching.
//
// Deliberately transparent rather than clever: the score is arithmetic over two
// skill sets, so any number the UI shows can be explained and audited. No model,
// no embeddings, no training data.
//
// Two signals go into a match:
//
//   coverage — of the skills this role asks for, what fraction does the seeker
//              have? This is the question a recruiter actually asks, so it
//              carries most of the weight.
//   breadth  — of the seeker's skills, what fraction does this role use? It
//              separates two roles with equal coverage, favouring the one that
//              uses more of what the candidate actually knows.
//
// score = 100 * (0.75 * coverage + 0.25 * breadth)
//
// A role tagged [Python, SQL] against a seeker who knows [Python, SQL, Java]
// scores 0.75*1.0 + 0.25*0.67 = 92%. Full coverage, but not everything the
// candidate brings is relevant — which is honest, and why it isn't 100%.

const COVERAGE_WEIGHT = 0.75
const BREADTH_WEIGHT = 0.25

// Jobs posted before `skills` existed have nothing to compare against, so we
// look for the seeker's skills in the posting's own words instead. That can't
// produce a real coverage figure — we don't know the full requirement set — so
// the result is capped below a properly tagged match rather than presented with
// equal confidence.
const INFERRED_MATCH_CEILING = 85

function normalise(skill) {
  return String(skill || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
}

function toSkillSet(skills) {
  return new Set((skills || []).map(normalise).filter(Boolean))
}

// Whole-token test, so "Java" doesn't match inside "JavaScript". `+` and `#`
// count as part of a token so "C++" and "C#" survive.
function appearsIn(haystack, skill) {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i').test(haystack)
}

function jobText(job) {
  return [
    job.title,
    job.description,
    ...(job.requirements || []),
    ...(job.responsibilities || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

// Returns { score, matchedSkills, inferred } — or null when nothing matches, so
// callers can filter irrelevant roles out entirely rather than showing a 0%.
export function scoreJobForSkills(job, seekerSkills) {
  const seekerSet = toSkillSet(seekerSkills)
  if (seekerSet.size === 0) return null

  const requiredSet = toSkillSet(job.skills)

  // ---- Preferred path: the employer tagged the role's skills ----
  if (requiredSet.size > 0) {
    const matched = [...requiredSet].filter((skill) => seekerSet.has(skill))
    if (matched.length === 0) return null

    const coverage = matched.length / requiredSet.size
    const breadth = matched.length / seekerSet.size
    const score = Math.round(100 * (COVERAGE_WEIGHT * coverage + BREADTH_WEIGHT * breadth))

    return {
      score: Math.min(score, 100),
      matchedSkills: matchedOriginalCasing(job.skills, matched),
      inferred: false,
    }
  }

  // ---- Fallback: infer from the posting's text ----
  const haystack = jobText(job)
  const matched = [...seekerSet].filter((skill) => appearsIn(haystack, skill))
  if (matched.length === 0) return null

  const proportion = matched.length / seekerSet.size
  const score = Math.round(INFERRED_MATCH_CEILING * proportion)

  return {
    score: Math.max(score, 1),
    matchedSkills: matchedOriginalCasing(seekerSkills, matched),
    inferred: true,
  }
}

// Report skills back the way they were written ("JavaScript", not "javascript"),
// since these strings get shown to the user. Trimmed on the way out as well:
// cleanSkills normalises everything written through the API, but data that
// predates it shouldn't render as " python ".
function matchedOriginalCasing(originals, normalisedMatches) {
  const wanted = new Set(normalisedMatches)
  const seen = new Set()
  const out = []

  for (const original of originals || []) {
    const key = normalise(original)
    if (wanted.has(key) && !seen.has(key)) {
      seen.add(key)
      out.push(String(original).trim().replace(/\s+/g, ' '))
    }
  }

  return out
}
