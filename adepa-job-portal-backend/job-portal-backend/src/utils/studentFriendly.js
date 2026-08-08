// What counts as an opportunity for a student or recent graduate.
//
// One definition, expressed twice — as a predicate for scoring in application
// code, and as a Mongo filter for querying. Keeping both in this file is the
// point: if they lived apart, the homepage feed and the recommendation ranking
// would eventually disagree about the same job.
//
// A job qualifies on either count:
//   - its engagement type is one students actually apply for, or
//   - the employer has marked it entry level, whatever the type
//
// Note what is deliberately absent: no keyword sniffing of titles for "junior"
// or "graduate". A job is in this feed because an employer classified it, which
// means the feed is explainable and an employer can control whether they appear
// in it.

export const STUDENT_JOB_TYPES = ['Internship', 'National Service', 'Graduate trainee']

export const ENTRY_LEVEL = 'Entry level'

export function isStudentFriendly(job) {
  if (!job) return false
  return STUDENT_JOB_TYPES.includes(job.type) || job.experienceLevel === ENTRY_LEVEL
}

// Spread into a Mongo query alongside other conditions. Uses $or, so callers
// combining it with their own $or must nest both under $and.
export const studentFriendlyQuery = {
  $or: [{ type: { $in: STUDENT_JOB_TYPES } }, { experienceLevel: ENTRY_LEVEL }],
}

// Levels as Ghanaian universities actually number them, plus the two stages
// either side of graduating.
export const STUDENT_LEVELS = [
  'Level 100',
  'Level 200',
  'Level 300',
  'Level 400',
  'Postgraduate',
  'Recent graduate',
  'National Service',
]

// Very light field-of-study signal: shared words between what someone studies
// and a job's category. "Information Technology" overlaps "IT & Software" on
// nothing, so this is a tie-breaker only and never the reason a job appears —
// the skills match and the student-friendly flag do that work.
const STOP_WORDS = new Set(['and', '&', 'of', 'the', 'in', 'studies', 'science', 'sciences'])

export function fieldMatchesCategory(fieldOfStudy, category) {
  if (!fieldOfStudy || !category) return false

  const words = (text) =>
    new Set(
      String(text)
        .toLowerCase()
        .split(/[^a-z0-9+#]+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    )

  const fieldWords = words(fieldOfStudy)
  for (const word of words(category)) {
    if (fieldWords.has(word)) return true
  }

  return false
}
