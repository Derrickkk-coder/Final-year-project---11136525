import React, { useState } from 'react'
import AiIcon from './AiIcon.jsx'
import { fetchSkillResources } from '../api/skills.js'

// Explains a match rather than just asserting a number: which of the role's
// skills the seeker has, and which they're missing.
//
// The missing list is the useful half — it turns a rejection-shaped "68%" into
// something actionable ("learn Spring Boot"). It's only knowable for roles the
// employer tagged, so an inferred match says so instead of implying the picture
// is complete.
//
// Each missing skill can expand into where to go learn it, fetched on demand
// per skill rather than all at once — the list is often 3-4 skills long, and
// fetching every one on render would mean several AI calls for a card the
// seeker may not even read past the first line.
export default function MatchBreakdown({
  matchedSkills = [],
  missingSkills = [],
  matchedCount,
  requiredCount,
  inferred = false,
  compact = false,
  jobTitle = null,
}) {
  // Keyed by skill name: undefined (not opened), 'loading', 'error', or the
  // resolved { resources } payload.
  const [lookups, setLookups] = useState({})

  if (matchedSkills.length === 0 && missingSkills.length === 0) return null

  const openLookup = async (skill) => {
    const current = lookups[skill]
    // A second click on an already-open or in-flight lookup just closes it —
    // there's nothing to re-fetch, the resources for a skill aren't going to
    // change between two clicks a second apart.
    if (current && current !== 'error') {
      setLookups((prev) => ({ ...prev, [skill]: undefined }))
      return
    }

    setLookups((prev) => ({ ...prev, [skill]: 'loading' }))
    try {
      const data = await fetchSkillResources(skill, jobTitle)
      setLookups((prev) => ({ ...prev, [skill]: { resources: data.resources } }))
    } catch {
      setLookups((prev) => ({ ...prev, [skill]: 'error' }))
    }
  }

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
        {missingSkills.map((skill) => {
          const lookup = lookups[skill]
          return (
            <li className="match-skill is-missing" key={`missing-${skill}`}>
              <div className="match-skill__row">
                <span>
                  <span aria-hidden="true">⚠</span> {skill}
                  <span className="match-skill__note"> — missing</span>
                </span>
                <button
                  type="button"
                  className="match-skill__learn"
                  onClick={() => openLookup(skill)}
                  aria-expanded={Boolean(lookup)}
                >
                  <AiIcon size={12} />
                  {lookup ? 'Hide' : 'Find a free course'}
                </button>
              </div>

              {lookup === 'loading' && (
                <p className="match-skill__resources-status">Looking...</p>
              )}
              {lookup === 'error' && (
                <p className="match-skill__resources-status is-error">
                  Couldn't find anything right now — try again in a moment.
                </p>
              )}
              {lookup && lookup !== 'loading' && lookup !== 'error' && (
                <ul className="match-skill__resources">
                  {lookup.resources.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.title}
                      </a>
                      <span className="match-skill__provider">{r.provider}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {inferred && (
        <p className="match-detail__caveat">
          Estimated from the job text, so it's less precise than a tagged role.
        </p>
      )}
    </div>
  )
}
