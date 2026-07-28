import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { fetchMyJobs } from '../api/jobs.js'
import { fetchApplicationsForEmployer, updateApplicationStatus } from '../api/applications.js'

const STATUS_OPTIONS = ['pending', 'review', 'accepted', 'rejected']

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function EmployerDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('jobs')

  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    Promise.all([fetchMyJobs(), fetchApplicationsForEmployer()])
      .then(([jobsData, appsData]) => {
        setJobs(jobsData.jobs)
        setApplications(appsData.applications)
      })
      .catch(() => setError('Could not load your dashboard right now.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId)
    try {
      const data = await updateApplicationStatus(applicationId, newStatus)
      setApplications((prev) =>
        prev.map((a) => (a._id === applicationId ? { ...a, status: data.application.status } : a))
      )
    } catch {
      // Silently ignore for now — could add a toast/error banner here later
    } finally {
      setUpdatingId(null)
    }
  }

  const openJobs = jobs.filter((j) => j.status === 'open').length
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0)
  const pendingCount = applications.filter((a) => a.status === 'pending').length

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar__group">
          <span className="dash-sidebar__label">Employer</span>
          <a href="#jobs" className={tab === 'jobs' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setTab('jobs') }}>
            My job postings
          </a>
          <a href="#applicants" className={tab === 'applicants' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setTab('applicants') }}>
            Applicants
          </a>
        </div>
        <div className="dash-sidebar__group">
  <span className="dash-sidebar__label">Account</span>
  <Link to="/employer/profile">Company profile</Link>
</div>
      </aside>

      <div className="dash-main">
        <div className="dash-header">
          <div>
            <span className="eyebrow">Employer dashboard</span>
            <h1 style={{ fontSize: 26, marginTop: 6 }}>{user?.name}</h1>
          </div>
          <Link to="/employer/post" className="btn btn--coral">+ Post a new job</Link>
        </div>

        {loading && <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Loading your dashboard…</p>}

        {error && (
          <div className="empty-state">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-card__num">{jobs.length}</div>
                <div className="stat-card__label">Total postings</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__num">{openJobs}</div>
                <div className="stat-card__label">Currently open</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__num">{totalApplicants}</div>
                <div className="stat-card__label">Total applicants</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__num">{pendingCount}</div>
                <div className="stat-card__label">Awaiting review</div>
              </div>
            </div>

            {tab === 'jobs' && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 14 }}>My job postings</h2>
                {jobs.length > 0 ? (
                  <>
                    {/* Desktop: table */}
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Ref</th>
                            <th>Role</th>
                            <th>Applicants</th>
                            <th>Posted</th>
                            <th>Closes</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.map((job) => (
                            <tr key={job._id}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{job.ref}</td>
                              <td style={{ fontWeight: 600 }}>
                                <Link to={`/jobs/${job._id}`} style={{ color: 'var(--ink)' }}>{job.title}</Link>
                              </td>
                              <td>{job.applicantsCount || 0}</td>
                              <td>{formatDate(job.createdAt)}</td>
                              <td>{formatDate(job.closingAt)}</td>
                              <td><StatusPill status={job.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile: stacked cards */}
                    <div className="card-list">
                      {jobs.map((job) => (
                        <div className="data-card" key={job._id}>
                          <div className="data-card__top">
                            <div>
                              <Link to={`/jobs/${job._id}`} className="data-card__title" style={{ color: 'var(--ink)' }}>
                                {job.title}
                              </Link>
                              <div className="data-card__sub" style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>{job.ref}</div>
                            </div>
                            <StatusPill status={job.status} />
                          </div>
                          <div className="data-card__row">
                            <span className="data-card__row-label">Applicants</span>
                            <span>{job.applicantsCount || 0}</span>
                          </div>
                          <div className="data-card__row">
                            <span className="data-card__row-label">Posted</span>
                            <span>{formatDate(job.createdAt)}</span>
                          </div>
                          <div className="data-card__row">
                            <span className="data-card__row-label">Closes</span>
                            <span>{formatDate(job.closingAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <h3>No jobs posted yet</h3>
                    <p>Post your first vacancy to start receiving applicants.</p>
                    <Link to="/employer/post" className="btn btn--coral" style={{ marginTop: 16 }}>+ Post a new job</Link>
                  </div>
                )}
              </>
            )}

            {tab === 'applicants' && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 14 }}>Applicants across all roles</h2>
                {applications.length > 0 ? (
                  <>
                    {/* Desktop: table */}
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Applicant</th>
                            <th>Role</th>
                            <th>Applied</th>
                            <th>Status</th>
                            <th>Update status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((app) => (
                            <tr key={app._id}>
                              <td style={{ fontWeight: 600 }}>{app.applicant?.name || 'Unknown applicant'}</td>
                              <td>{app.job?.title || '—'}</td>
                              <td>{formatDate(app.createdAt)}</td>
                              <td><StatusPill status={app.status} /></td>
                              <td>
                                <select
                                  value={app.status}
                                  disabled={updatingId === app._id}
                                  onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                  style={{ border: '1.5px solid var(--line)', borderRadius: 6, padding: '6px 8px', fontSize: 13 }}
                                >
                                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile: stacked cards */}
                    <div className="card-list">
                      {applications.map((app) => (
                        <div className="data-card" key={app._id}>
                          <div className="data-card__top">
                            <div>
                              <div className="data-card__title">{app.applicant?.name || 'Unknown applicant'}</div>
                              <div className="data-card__sub">{app.job?.title || '—'}</div>
                            </div>
                            <StatusPill status={app.status} />
                          </div>
                          <div className="data-card__row">
                            <span className="data-card__row-label">Applied</span>
                            <span>{formatDate(app.createdAt)}</span>
                          </div>
                          <div className="data-card__row" style={{ alignItems: 'center' }}>
                            <span className="data-card__row-label">Update status</span>
                            <select
                              value={app.status}
                              disabled={updatingId === app._id}
                              onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <h3>No applicants yet</h3>
                    <p>Once job seekers apply to your postings, they'll show up here.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}