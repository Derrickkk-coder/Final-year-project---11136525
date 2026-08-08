import React from 'react'

// Explains a match rather than just asserting a number: which of the role's
// skills the seeker has, and which they're missing.
//
// The missing list is the useful half — it turns a rejection-shaped "68%" into
// something actionable ("learn Spring Boot"). It's only knowable for roles the
// employer tagged, so an inferred match says so instead of implying the picture
// is complete.
export default function MatchBreakdown({
  matchedSkills = [],
  missingSkills = [],
  matchedCount,
  requiredCount,
  inferred = false,
  compact = false,
}) {
  if (matchedSkills.length === 0 && missingSkills.length === 0) return null

  return (
    <div className={`match-detail ${compact ? 'is-compact' : ''}`}>
      <p className="match-detail__summary">
        {requiredCount
          ? <>Your skills match <strong>{matchedCount} of {requiredCount}</strong> required skills.</>
          : <>Matched from this role's description — the employer hasn't tagged specific skills.</>}
      </p>

      <ul className="match-detail__list">
        {matchedSkills.map((skill) => (
          <li className="match-skill is-have" key={`have-${skill}`}>
            <span aria-hidden="true">✓</span> {skill}
          </li>
        ))}
        {missingSkills.map((skill) => (
          <li className="match-skill is-missing" key={`missing-${skill}`}>
            <span aria-hidden="true">⚠</span> {skill}
            <span className="match-skill__note"> — missing</span>
          </li>
        ))}
      </ul>

      {inferred && (
        <p className="match-detail__caveat">
          Estimated from the job text, so it's less precise than a tagged role.
        </p>
      )}
    </div>
  )
}
