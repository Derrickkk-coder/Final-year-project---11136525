import React from 'react'
import { Link } from 'react-router-dom'

function daysLeft(closingAt) {
  const diff = Math.ceil((new Date(closingAt) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function JobCard({ job }) {
  const left = daysLeft(job.closingAt)
  const closingSoon = left <= 5

  return (
    <Link to={`/jobs/${job._id}`} className="ticket" style={{ color: 'inherit' }}>
      <div className="ticket__main">
        <div className="ticket__perf" aria-hidden="true" />
        <span className="ticket__ref">REF {job.ref}</span>
        <h3 className="ticket__title">{job.title}</h3>
        <div className="ticket__company">{job.company}</div>

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