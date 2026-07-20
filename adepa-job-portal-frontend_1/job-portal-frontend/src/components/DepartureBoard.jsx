import React, { useEffect, useState } from 'react'
import { fetchJobs } from '../api/jobs.js'

export default function DepartureBoard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs({ limit: 5 })
      .then((data) => setJobs(data.jobs))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="board" role="table" aria-label="Recently posted jobs">
      <div className="board__header">
        <span>Ref</span>
        <span>Role · Company</span>
        <span>Location</span>
        <span>Status</span>
      </div>

      {loading && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
          Loading roles…
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
          No roles posted yet — be the first to post one.
        </div>
      )}

      {jobs.map((job) => (
        <div className="board__row" key={job._id} role="row">
          <span className="flap">{job.ref}</span>
          <span className="flap flap--wide">
            {job.title} <span style={{ opacity: 0.55 }}>· {job.company}</span>
          </span>
          <span className="flap">{job.location.split(',')[0]}</span>
          <span className="flap flap--status">OPEN</span>
        </div>
      ))}
    </div>
  )
}