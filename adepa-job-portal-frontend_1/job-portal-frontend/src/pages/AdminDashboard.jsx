import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import StatusPill from '../components/StatusPill.jsx'
import {
  fetchEmployers, approveEmployer, rejectEmployer, fetchAdminStats,
  fetchAllUsers, setUserActiveStatus, fetchAllJobsAdmin, deleteJobAdmin,
} from '../api/admin.js'

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const EMPLOYER_TABS = [
  { key: 'pending', label: 'Pending employers' },
  { key: 'approved', label: 'Approved employers' },
  { key: 'rejected', label: 'Rejected employers' },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pending')

  const [stats, setStats] = useState(null)
  const [employers, setEmployers] = useState([])
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioningId, setActioningId] = useState(null)

  useEffect(() => {
    fetchAdminStats()
      .then((data) => setStats(data.stats))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')

    if (tab === 'users') {
      fetchAllUsers()
        .then((data) => setUsers(data.users))
        .catch(() => setError('Could not load users right now.'))
        .finally(() => setLoading(false))
    } else if (tab === 'jobs') {
      fetchAllJobsAdmin()
        .then((data) => setJobs(data.jobs))
        .catch(() => setError('Could not load jobs right now.'))
        .finally(() => setLoading(false))
    } else {
      fetchEmployers(tab)
        .then((data) => setEmployers(data.employers))
        .catch(() => setError('Could not load employer accounts right now.'))
        .finally(() => setLoading(false))
    }
  }, [tab])

  const refreshStats = () => {
    fetchAdminStats().then((data) => setStats(data.stats)).catch(() => {})
  }

  const handleApprove = async (id) => {
    setActioningId(id)
    try {
      await approveEmployer(id)
      setEmployers((prev) => prev.filter((e) => e._id !== id))
      refreshStats()
    } catch {
      // could add a toast here later
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (id) => {
    setActioningId(id)
    try {
      await rejectEmployer(id)
      setEmployers((prev) => prev.filter((e) => e._id !== id))
      refreshStats()
    } catch {
    } finally {
      setActioningId(null)
    }
  }

  const handleToggleUserActive = async (id, currentIsActive) => {
    setActioningId(id)
    try {
      await setUserActiveStatus(id, !currentIsActive)
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !currentIsActive } : u)))
    } catch {
    } finally {
      setActioningId(null)
    }
  }

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Permanently remove this job posting? This cannot be undone.')) return
    setActioningId(id)
    try {
      await deleteJobAdmin(id)
      setJobs((prev) => prev.filter((j) => j._id !== id))
      refreshStats()
    } catch {
    } finally {
      setActioningId(null)
    }
  }

  const isEmployerTab = tab === 'pending' || tab === 'approved' || tab === 'rejected'

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar__group">
          <span className="dash-sidebar__label">Employers</span>
          {EMPLOYER_TABS.map((t) => (
            <a key={t.key} href={`#${t.key}`} className={tab === t.key ? 'active' : ''} onClick={(e) => { e.preventDefault(); setTab(t.key) }}>{t.label}</a>
          ))}
        </div>
        <div className="dash-sidebar__group">
          <span className="dash-sidebar__label">Platform</span>
          <a href="#users" className={tab === 'users' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setTab('users') }}>
            All users
          </a>
          <a href="#jobs" className={tab === 'jobs' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setTab('jobs') }}>
            All jobs
          </a>
        </div>
      </aside>

      <div className="dash-main">
        <div className="dash-header">
          <div>
            <span className="eyebrow">Admin dashboard</span>
            <h1 style={{ fontSize: 26, marginTop: 6 }}>{user?.name}</h1>
          </div>
        </div>

        {stats && (
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card__num">{stats.totalSeekers}</div>
              <div className="stat-card__label">Job seekers</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__num">{stats.totalEmployers}</div>
              <div className="stat-card__label">Employers</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__num">{stats.pendingEmployers}</div>
              <div className="stat-card__label">Awaiting approval</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__num">{stats.openJobs}</div>
              <div className="stat-card__label">Open jobs</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__num">{stats.totalJobs}</div>
              <div className="stat-card__label">Total jobs posted</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__num">{stats.totalApplications}</div>
              <div className="stat-card__label">Total applications</div>
            </div>
          </div>
        )}

        {loading && <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Loading…</p>}

        {error && (
          <div className="empty-state">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && isEmployerTab && (
          <>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>
              {EMPLOYER_TABS.find((t) => t.key === tab)?.label}
            </h2>

            {employers.length > 0 ? (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Contact name</th>
                        <th>Email</th>
                        <th>Registered</th>
                        {tab === 'pending' && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {employers.map((emp) => (
                        <tr key={emp._id}>
                          <td style={{ fontWeight: 600 }}>{emp.company || '—'}</td>
                          <td>{emp.name}</td>
                          <td><a href={`mailto:${emp.email}`} style={{ color: 'var(--teal-700)' }}>{emp.email}</a></td>
                          <td>{formatDate(emp.createdAt)}</td>
                          {tab === 'pending' && (
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn--pine btn--sm" disabled={actioningId === emp._id} onClick={() => handleApprove(emp._id)}>
                                  Approve
                                </button>
                                <button className="btn btn--ghost btn--sm" disabled={actioningId === emp._id} onClick={() => handleReject(emp._id)}>
                                  Reject
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="card-list">
                  {employers.map((emp) => (
                    <div className="data-card" key={emp._id}>
                      <div className="data-card__top">
                        <div>
                          <div className="data-card__title">{emp.company || 'No company name'}</div>
                          <div className="data-card__sub">{emp.name}</div>
                        </div>
                      </div>
                      <div className="data-card__row">
                        <span className="data-card__row-label">Email</span>
                        <a href={`mailto:${emp.email}`} style={{ color: 'var(--teal-700)', fontWeight: 600 }}>{emp.email}</a>
                      </div>
                      <div className="data-card__row">
                        <span className="data-card__row-label">Registered</span>
                        <span>{formatDate(emp.createdAt)}</span>
                      </div>
                      {tab === 'pending' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button className="btn btn--pine btn--sm" style={{ flex: 1 }} disabled={actioningId === emp._id} onClick={() => handleApprove(emp._id)}>
                            Approve
                          </button>
                          <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} disabled={actioningId === emp._id} onClick={() => handleReject(emp._id)}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>No {tab} employers</h3>
                <p>
                  {tab === 'pending'
                    ? "You're all caught up — no employer accounts are waiting on review."
                    : `No employer accounts are currently marked as ${tab}.`}
                </p>
              </div>
            )}
          </>
        )}

        {!loading && !error && tab === 'users' && (
          <>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>All users</h2>

            {users.length > 0 ? (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td style={{ fontWeight: 600 }}>{u.name}</td>
                          <td>{u.email}</td>
                          <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                          <td><StatusPill status={u.isActive ? 'active' : 'inactive'} /></td>
                          <td>
                            <button
                              className="btn btn--ghost btn--sm"
                              disabled={actioningId === u._id}
                              onClick={() => handleToggleUserActive(u._id, u.isActive)}
                            >
                              {u.isActive ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="card-list">
                  {users.map((u) => (
                    <div className="data-card" key={u._id}>
                      <div className="data-card__top">
                        <div>
                          <div className="data-card__title">{u.name}</div>
                          <div className="data-card__sub" style={{ textTransform: 'capitalize' }}>{u.role}</div>
                        </div>
                        <StatusPill status={u.isActive ? 'active' : 'inactive'} />
                      </div>
                      <div className="data-card__row">
                        <span className="data-card__row-label">Email</span>
                        <span>{u.email}</span>
                      </div>
                      <button
                        className="btn btn--ghost btn--sm btn--block"
                        style={{ marginTop: 10 }}
                        disabled={actioningId === u._id}
                        onClick={() => handleToggleUserActive(u._id, u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>No users yet</h3>
                <p>Registered job seekers and employers will show up here.</p>
              </div>
            )}
          </>
        )}

        {!loading && !error && tab === 'jobs' && (
          <>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>All jobs</h2>

            {jobs.length > 0 ? (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Company</th>
                        <th>Posted by</th>
                        <th>Applicants</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job._id}>
                          <td style={{ fontWeight: 600 }}>
                            <Link to={`/jobs/${job._id}`} style={{ color: 'var(--ink)' }}>{job.title}</Link>
                          </td>
                          <td>{job.company}</td>
                          <td>{job.postedBy?.name || 'Unknown'}</td>
                          <td>{job.applicantsCount || 0}</td>
                          <td><StatusPill status={job.status} /></td>
                          <td>
                            <button
                              className="btn btn--ghost btn--sm"
                              disabled={actioningId === job._id}
                              onClick={() => handleDeleteJob(job._id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="card-list">
                  {jobs.map((job) => (
                    <div className="data-card" key={job._id}>
                      <div className="data-card__top">
                        <div>
                          <Link to={`/jobs/${job._id}`} className="data-card__title" style={{ color: 'var(--ink)' }}>
                            {job.title}
                          </Link>
                          <div className="data-card__sub">{job.company}</div>
                        </div>
                        <StatusPill status={job.status} />
                      </div>
                      <div className="data-card__row">
                        <span className="data-card__row-label">Posted by</span>
                        <span>{job.postedBy?.name || 'Unknown'}</span>
                      </div>
                      <div className="data-card__row">
                        <span className="data-card__row-label">Applicants</span>
                        <span>{job.applicantsCount || 0}</span>
                      </div>
                      <button
                        className="btn btn--ghost btn--sm btn--block"
                        style={{ marginTop: 10 }}
                        disabled={actioningId === job._id}
                        onClick={() => handleDeleteJob(job._id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>No jobs yet</h3>
                <p>Job postings from employers will show up here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}