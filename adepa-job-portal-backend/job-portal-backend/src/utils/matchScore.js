// Skill-based job matching.
//
//     Match % = matching skills ÷ required skills × 100
//
// Deliberately transparent rather than clever: one division over two skill
// sets, so every number the UI shows can be explained and checked by hand. No
// model, no embeddings, no training data.
//
// A seeker with [Python, Java, SQL, HTML, CSS] against a role requiring
// [Python, SQL, REST API, ... 9 total] of which they have 8 scores 8/9 = 89%,
// and the UI reports both the percentage and the fraction it came from.
//
// Known limitation, worth being ready to answer: a role tagged with a single
// skill the seeker happens to have scores 100%, outranking a thoroughly
// specified 8-of-9 role at 89%. The denominator is what makes the difference,
// which is exactly why `requiredCount` is returned and shown — "1/1" reads very
// differently from "8/9" even though the percentage is higher. Ranking breaks
// ties on matched count for the same reason.

// Jobs posted before `skills` existed have nothing to compare against, so we
// look for the seeker's skills in the posting's own words instead. That can't
// produce a real coverage figure — we don't know the full requirement set — so
// the result is capped below a properly tagged match rather than presented with
// equal confidence, and no fraction or missing-skill list is claimed.
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

// Keeps each skill's original spelling for display alongside the normalised key
// used for comparison, de-duplicated so a job tagged ["SQL", "sql"] counts once
// and can't inflate its own denominator.
function toComparableList(skills) {
  const seen = new Set()
  const out = []

  for (const raw of skills || []) {
    const key = normalise(raw)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({ key, label: String(raw).trim().replace(/\s+/g, ' ') })
  }

  return out
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

// Returns null when nothing matches, so callers can drop irrelevant roles
// entirely rather than listing them at 0%.
export function scoreJobForSkills(job, seekerSkills) {
  const seekerSet = toSkillSet(seekerSkills)
  if (seekerSet.size === 0) return null

  const required = toComparableList(job.skills)

  // ---- Preferred path: the employer tagged the role's skills ----
  if (required.length > 0) {
    const matched = required.filter((s) => seekerSet.has(s.key))
    if (matched.length === 0) return null

    return {
      score: Math.round((matched.length / required.length) * 100),
      matchedSkills: matched.map((s) => s.label),
      missingSkills: required.filter((s) => !seekerSet.has(s.key)).map((s) => s.label),
      matchedCount: matched.length,
      requiredCount: required.length,
      inferred: false,
    }
  }

  // ---- Fallback: infer from the posting's text ----
  const haystack = jobText(job)
  const matched = toComparableList(seekerSkills).filter((s) => appearsIn(haystack, s.key))
  if (matched.length === 0) return null

  const proportion = matched.length / seekerSet.size

  return {
    score: Math.max(Math.round(INFERRED_MATCH_CEILING * proportion), 1),
    matchedSkills: matched.map((s) => s.label),
    // Unknowable without tagged requirements — deliberately empty rather than
    // guessed, so the UI can say so instead of implying a complete picture.
    missingSkills: [],
    matchedCount: matched.length,
    requiredCount: null,
    inferred: true,
  }
}

// Attaches the match to a job under consistent field names, so the
// recommendations list and the job details page hand the client the same shape.
// Returns null when there's no match, letting callers decide between filtering
// the job out (recommendations) and serving it unannotated (job details).
export function withMatch(job, seekerSkills) {
  const match = scoreJobForSkills(job, seekerSkills)
  if (!match) return null

  return {
    ...job,
    matchScore: match.score,
    matchedSkills: match.matchedSkills,
    missingSkills: match.missingSkills,
    matchedCount: match.matchedCount,
    requiredCount: match.requiredCount,
    matchInferred: match.inferred,
  }
}
