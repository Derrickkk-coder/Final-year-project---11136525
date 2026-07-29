import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { fetchMyApplications } from '../api/applications.js'

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function JobSeekerDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyApplications()
      .then((data) => setApplications(data.applications))
      .catch(() => setError('Could not load your applications right now.'))
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    review: applications.filter((a) => a.status === 'review').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar__group">
          <span className="dash-sidebar__label">Job seeker</span>
          <a href="/dashboard" className="active">My applications</a>
          <a href="/jobs">Browse jobs</a>
        </div>
      </aside>

      <div className="dash-main">
        <div className="dash-header">
          <div>
            <span className="eyebrow">Welcome back</span>
            <h1 style={{ fontSize: 26, marginTop: 6 }}>{user?.name}</h1>
          </div>
          <Link to="/jobs" className="btn btn--pine">Find more jobs</Link>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card__num">{counts.total}</div>
            <div className="stat-card__label">Total applications</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__num">{counts.pending}</div>
            <div className="stat-card__label">Pending review</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__num">{counts.review}</div>
            <div className="stat-card__label">In review</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__num">{counts.accepted}</div>
            <div className="stat-card__label">Accepted</div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Application history</h2>

        {loading && <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Loading your applications…</p>}

        {error && (
          <div className="empty-state">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          applications.length > 0 ? (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Company</th>
                      <th>Applied</th>
                      <th>Resume</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id}>
                        <td>
                          <Link to={`/jobs/${app.job?._id}`} style={{ fontWeight: 600, color: 'var(--ink)' }}>
                            {app.job?.title || 'Job no longer available'}
                          </Link>
                        </td>
                        <td>{app.job?.company || '—'}</td>
                        <td>{formatDate(app.createdAt)}</td>
                        <td>
                          {app.resumeUrl ? (
                            <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                              View
                            </a>
                          ) : '—'}
                        </td>
                        <td><StatusPill status={app.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card-list">
                {applications.map((app) => (
                  <div className="data-card" key={app._id}>
                    <div className="data-card__top">
                      <div>
                        <Link to={`/jobs/${app.job?._id}`} className="data-card__title" style={{ color: 'var(--ink)' }}>
                          {app.job?.title || 'Job no longer available'}
                        </Link>
                        <div className="data-card__sub">{app.job?.company || '—'}</div>
                      </div>
                      <StatusPill status={app.status} />
                    </div>
                    <div className="data-card__row">
                      <span className="data-card__row-label">Applied</span>
                      <span>{formatDate(app.createdAt)}</span>
                    </div>
                    <div className="data-card__row">
                      <span className="data-card__row-label">Resume</span>
                      {app.resumeUrl ? (
                        <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal-700)', fontWeight: 600 }}>
                          View
                        </a>
                      ) : <span>—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No applications yet</h3>
              <p>Once you apply for a role, you'll be able to track its status here.</p>
              <Link to="/jobs" className="btn btn--pine" style={{ marginTop: 16 }}>Browse jobs</Link>
            </div>
          )
        )}
      </div>
    </div>
  )
}