import React from 'react'
import { Link } from 'react-router-dom'
import MatchBreakdown from './MatchBreakdown.jsx'

// The showcase card for skill-matched recommendations. Leads with the score,
// because that's the reason the row is on screen at all, then justifies it.
//
// Separate from JobCard rather than a variant of it: the jobs board shows many
// rows and wants a compact, uniform card, whereas this is a short ranked list
// where the extra explanation is the whole point.
function matchTone(score) {
  if (score >= 80) return 'is-strong'
  if (score >= 50) return 'is-moderate'
  return 'is-weak'
}

export default function RecommendedJobCard({ job }) {
  return (
    <article className={`rec-card ${matchTone(job.matchScore)}`}>
      <header className="rec-card__head">
        <div className="rec-card__score" aria-hidden="true">
          <span className="rec-card__score-num">{job.matchScore}%</span>
          <span className="rec-card__score-label">match</span>
        </div>

        <div className="rec-card__ident">
          <Link to={`/jobs/${job._id}`} className="rec-card__title">
            {job.title}
          </Link>
          <p className="rec-card__company">{job.company}</p>
          <p className="rec-card__meta">
            {job.location?.split(',')[0]} · {job.remote} · {job.type}
            {job.salary ? ` · ${job.salary}` : ''}
          </p>
        </div>
      </header>

      <MatchBreakdown
        matchedSkills={job.matchedSkills}
        missingSkills={job.missingSkills}
        matchedCount={job.matchedCount}
        requiredCount={job.requiredCount}
        inferred={job.matchInferred}
      />

      <footer className="rec-card__foot">
        {/* Goes to the job page rather than submitting anything: applying needs a
            CV, phone and contact email, so "one-click apply" would be a lie. */}
        <Link to={`/jobs/${job._id}`} className="btn btn--coral btn--sm btn--shine">
          Apply now
        </Link>
        <Link to={`/jobs/${job._id}`} className="btn btn--ghost btn--sm">
          View details
        </Link>
      </footer>
    </article>
  )
}
