import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useConfirm } from '../context/ConfirmContext.jsx'
import StatusPill from '../components/StatusPill.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'
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
  const toast = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState('pending')

  const [stats, setStats] = useState(null)
  const [employers, setEmployers] = useState([])
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioningId, setActioningId] = useState(null)
  // Bumped by "Try again" to re-run the tab's fetch without switching tabs
  const [reloadKey, setReloadKey] = useState(0)

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
  }, [tab, reloadKey])

  const refreshStats = () => {
    fetchAdminStats().then((data) => setStats(data.stats)).catch(() => {})
  }

  // Every handler below used to swallow its error silently, so a failed action
  // looked identical to a successful one — the row just didn't move. They now
  // report both outcomes.
  const handleApprove = async (employer) => {
    setActioningId(employer._id)
    try {
      await approveEmployer(employer._id)
      setEmployers((prev) => prev.filter((e) => e._id !== employer._id))
      refreshStats()
      toast.success(`${employer.company || employer.name} approved — they can now post jobs.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not approve that employer. Please try again.')
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (employer) => {
    const ok = await confirm({
      title: 'Reject this employer?',
      body: `${employer.company || employer.name} will not be able to post jobs. You can approve them later from the Rejected tab.`,
      confirmLabel: 'Reject employer',
      danger: true,
    })
    if (!ok) return

    setActioningId(employer._id)
    try {
      await rejectEmployer(employer._id)
      setEmployers((prev) => prev.filter((e) => e._id !== employer._id))
      refreshStats()
      toast.success(`${employer.company || employer.name} rejected.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reject that employer. Please try again.')
    } finally {
      setActioningId(null)
    }
  }

  const handleToggleUserActive = async (target) => {
    const deactivating = target.isActive

    // Only confirm the destructive direction — reactivating needs no ceremony
    if (deactivating) {
      const ok = await confirm({
        title: `Deactivate ${target.name}?`,
        body: 'They will be signed out immediately and blocked from logging back in. You can reactivate the account at any time.',
        confirmLabel: 'Deactivate account',
        danger: true,
      })
      if (!ok) return
    }

    setActioningId(target._id)
    try {
      await setUserActiveStatus(target._id, !target.isActive)
      setUsers((prev) =>
        prev.map((u) => (u._id === target._id ? { ...u, isActive: !target.isActive } : u))
      )
      toast.success(deactivating ? `${target.name} deactivated.` : `${target.name} reactivated.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update that account. Please try again.')
    } finally {
      setActioningId(null)
    }
  }

  const handleDeleteJob = async (job) => {
    const ok = await confirm({
      title: 'Remove this job posting?',
      body: `"${job.title}" will be permanently deleted from the platform. This cannot be undone.`,
      confirmLabel: 'Delete posting',
      danger: true,
    })
    if (!ok) return

    setActioningId(job._id)
    try {
      await deleteJobAdmin(job._id)
      setJobs((prev) => prev.filter((j) => j._id !== job._id))
      refreshStats()
      toast.success(`"${job.title}" removed.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove that posting. Please try again.')
    } finally {
      setActioningId(null)
    }
  }

  const isEmployerTab = tab === 'pending' || tab === 'approved' || tab === 'rejected'

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar dash-sidebar--admin">
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

        {loading && <SkeletonRows count={5} height={52} />}

        {!loading && error && (
          <EmptyState
            icon="⚠️"
            tone="error"
            title="Couldn't load that"
            description={error}
            action={
              <button className="btn btn--pine" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
            }
          />
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
                                <button className="btn btn--pine btn--sm" disabled={actioningId === emp._id} onClick={() => handleApprove(emp)}>
                                  Approve
                                </button>
                                <button className="btn btn--ghost btn--sm" disabled={actioningId === emp._id} onClick={() => handleReject(emp)}>
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
                          <button className="btn btn--pine btn--sm" style={{ flex: 1 }} disabled={actioningId === emp._id} onClick={() => handleApprove(emp)}>
                            Approve
                          </button>
                          <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} disabled={actioningId === emp._id} onClick={() => handleReject(emp)}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={tab === 'pending' ? '✅' : '🏢'}
                title={`No ${tab} employers`}
                description={
                  tab === 'pending'
                    ? "You're all caught up — no employer accounts are waiting on review."
                    : `No employer accounts are currently marked as ${tab}.`
                }
              />
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
                              onClick={() => handleToggleUserActive(u)}
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
                        onClick={() => handleToggleUserActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon="👥"
                title="No users yet"
                description="Registered job seekers and employers will show up here."
              />
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
                              onClick={() => handleDeleteJob(job)}
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
                        onClick={() => handleDeleteJob(job)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon="📭"
                title="No jobs yet"
                description="Job postings from employers will show up here."
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}