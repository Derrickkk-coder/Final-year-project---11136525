import React from 'react'
import { Link } from 'react-router-dom'

function daysLeft(closingAt) {
  const diff = Math.ceil((new Date(closingAt) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

// 80+ is a strong match, 50+ moderate — mirrors the thresholds the completion
// ring uses, so a green badge means the same thing in both places.
function matchTone(score) {
  if (score >= 80) return 'is-strong'
  if (score >= 50) return 'is-moderate'
  return 'is-weak'
}

export default function JobCard({ job }) {
  const left = daysLeft(job.closingAt)
  const closingSoon = left <= 5
  // Only present on jobs from the skill-matched recommendations endpoint
  const hasMatch = typeof job.matchScore === 'number'

  return (
    <Link to={`/jobs/${job._id}`} className="ticket" style={{ color: 'inherit' }}>
      <div className="ticket__main">
        <div className="ticket__perf" aria-hidden="true" />
        <span className="ticket__ref">REF {job.ref}</span>
        <h3 className="ticket__title">{job.title}</h3>
        <div className="ticket__company">{job.company}</div>

        {hasMatch && (
          <div className={`match-badge ${matchTone(job.matchScore)}`}>
            <span className="match-badge__score">{job.matchScore}% match</span>
            {job.matchedSkills?.length > 0 && (
              <span className="match-badge__skills">
                {job.matchedSkills.slice(0, 4).join(' · ')}
                {job.matchedSkills.length > 4 && ` +${job.matchedSkills.length - 4}`}
              </span>
            )}
          </div>
        )}

        <div className="ticket__route">
          <span>{job.location.split(',')[0]}</span>
          <span className="dash" />
          <span>{job.remote}</span>
        </div>

        <div className="ticket__tags">
          <span className="tag">{job.type}</span>
          <span className="tag">{job.category}</span>
          {closingSoon && <span className="tag tag--rust">Closes in {left}d</span>}
          {!closingSoon && <span className="tag tag--gold">{job.applicantsCount || 0} applicants</span>}
        </div>
      </div>

      <div className="ticket__stub">
        <div>
          <div className="ticket__stub-label">Salary</div>
          <div className="ticket__stub-value">{job.salary || 'Not disclosed'}</div>
        </div>
        <span className="btn btn--gold btn--sm ticket__stub-cta">View</span>
      </div>
    </Link>
  )
}