import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useConfirm } from '../context/ConfirmContext.jsx'
import StatusPill from '../components/StatusPill.jsx'
import Avatar from '../components/Avatar.jsx'
import AiIcon from '../components/AiIcon.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonStatCards, SkeletonRows } from '../components/Skeleton.jsx'
import { toDownloadUrl } from '../api/cloudinary.js'
import { fetchMyJobs, updateJob } from '../api/jobs.js'
import { fetchApplicationsForEmployer, updateApplicationStatus, analyzeApplication } from '../api/applications.js'

const STATUS_OPTIONS = ['pending', 'review', 'accepted', 'rejected']

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function EmployerDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState('jobs')

  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [analyzeErrorId, setAnalyzeErrorId] = useState(null)
  const [expandedIds, setExpandedIds] = useState([])

  useEffect(() => {
    Promise.all([fetchMyJobs(), fetchApplicationsForEmployer()])
      .then(([jobsData, appsData]) => {
        setJobs(jobsData.jobs)
        setApplications(appsData.applications)
      })
      .catch(() => setError('Could not load your dashboard right now.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (application, newStatus) => {
    setUpdatingId(application._id)
    try {
      const data = await updateApplicationStatus(application._id, newStatus)
      setApplications((prev) =>
        prev.map((a) => (a._id === application._id ? { ...a, status: data.application.status } : a))
      )
      // Worth confirming explicitly: this also emails the applicant and puts a
      // notification in their dashboard, which isn't obvious from the dropdown.
      toast.success(
        `${application.applicant?.name || 'Applicant'} moved to "${newStatus}" — they've been notified by email.`
      )
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Could not update that application. Please try again.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAnalyze = async (applicationId, force = false) => {
    setAnalyzingId(applicationId)
    setAnalyzeErrorId(null)
    try {
      const data = await analyzeApplication(applicationId, force)
      setApplications((prev) =>
        prev.map((a) => (a._id === applicationId ? { ...a, aiAnalysis: data.analysis } : a))
      )
      setExpandedIds((prev) => (prev.includes(applicationId) ? prev : [...prev, applicationId]))
    } catch {
      setAnalyzeErrorId(applicationId)
    } finally {
      setAnalyzingId(null)
    }
  }

  const toggleExpanded = (applicationId) => {
    setExpandedIds((prev) =>
      prev.includes(applicationId) ? prev.filter((id) => id !== applicationId) : [...prev, applicationId]
    )
  }

  const handleToggleJobStatus = async (job) => {
    const closing = job.status === 'open'
    const newStatus = closing ? 'closed' : 'open'

    // Closing stops new applications arriving, so it's worth a check. Reopening
    // isn't destructive and goes straight through.
    if (closing) {
      const ok = await confirm({
        title: 'Close this posting?',
        body: `"${job.title}" will stop accepting applications and disappear from the public jobs board. You can reopen it at any time.`,
        confirmLabel: 'Close posting',
      })
      if (!ok) return
    }

    setUpdatingId(job._id)
    try {
      const data = await updateJob(job._id, { status: newStatus })
      setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, status: data.job.status } : j)))
      toast.success(closing ? `"${job.title}" is now closed.` : `"${job.title}" is open again.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update that posting. Please try again.')
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
      </aside>

      <div className="dash-main">
        <div className="dash-header">
          <div>
            <span className="eyebrow">Employer dashboard</span>
            <h1 style={{ fontSize: 26, marginTop: 6 }}>{user?.name}</h1>
          </div>
          <Link to="/employer/post" className="btn btn--coral">+ Post a new job</Link>
        </div>

        {user?.employerStatus === 'pending' && (
          <div className="panel" style={{ background: '#FFF3E0', border: '1px solid #F0D9A8', marginBottom: 24 }}>
            <strong style={{ color: '#8A5A0F' }}>Your account is awaiting admin approval.</strong>
            <p style={{ color: '#8A5A0F', fontSize: 14, marginTop: 4, marginBottom: 0 }}>
              You can browse your dashboard, but you won't be able to post jobs until an admin reviews your account.
            </p>
          </div>
        )}

        {user?.employerStatus === 'rejected' && (
          <div className="panel" style={{ background: '#FFE9E1', border: '1px solid #F5C4B0', marginBottom: 24 }}>
            <strong style={{ color: 'var(--coral-dark)' }}>Your employer account was not approved.</strong>
            <p style={{ color: 'var(--coral-dark)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>
              Contact support if you believe this is a mistake.
            </p>
          </div>
        )}

        {loading && (
          <>
            <SkeletonStatCards count={4} />
            <SkeletonRows count={5} height={52} />
          </>
        )}

        {!loading && error && (
          <EmptyState
            icon="⚠️"
            tone="error"
            title="Couldn't load your dashboard"
            description={error}
            action={
              <button className="btn btn--pine" onClick={() => window.location.reload()}>
                Reload
              </button>
            }
          />
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
                            <th>Actions</th>
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
                              <td>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <Link to={`/employer/jobs/${job._id}/edit`} className="btn btn--ghost btn--sm">Edit</Link>
                                  <button
                                    className="btn btn--ghost btn--sm"
                                    disabled={updatingId === job._id}
                                    onClick={() => handleToggleJobStatus(job)}
                                  >
                                    {job.status === 'open' ? 'Close' : 'Reopen'}
                                  </button>
                                </div>
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
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <Link to={`/employer/jobs/${job._id}/edit`} className="btn btn--ghost btn--sm" style={{ flex: 1 }}>Edit</Link>
                            <button
                              className="btn btn--ghost btn--sm"
                              style={{ flex: 1 }}
                              disabled={updatingId === job._id}
                              onClick={() => handleToggleJobStatus(job)}
                            >
                              {job.status === 'open' ? 'Close' : 'Reopen'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon="📋"
                    title="No jobs posted yet"
                    description="Post your first vacancy to start receiving applicants."
                    action={<Link to="/employer/post" className="btn btn--coral">+ Post a new job</Link>}
                  />
                )}
              </>
            )}

            {tab === 'applicants' && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 14 }}>Applicants across all roles</h2>
                {applications.length > 0 ? (
                  <>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Applicant</th>
                            <th>Role</th>
                            <th>Applied</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Resume</th>
                            <th>AI Fit</th>
                            <th>Status</th>
                            <th>Update status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((app) => (
                            <React.Fragment key={app._id}>
                              <tr>
                                <td style={{ fontWeight: 600 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Avatar src={app.applicant?.profilePictureUrl} name={app.applicant?.name} size={28} />
                                    {app.applicant?.name || 'Unknown applicant'}
                                  </div>
                                </td>
                                <td>{app.job?.title || '—'}</td>
                                <td>{formatDate(app.createdAt)}</td>
                                <td>
                                  {app.phone ? (
                                    <a href={`tel:${app.phone}`} style={{ color: 'var(--teal-700)' }}>{app.phone}</a>
                                  ) : '—'}
                                </td>
                                <td>
                                  {app.contactEmail || app.applicant?.email ? (
                                    <a href={`mailto:${app.contactEmail || app.applicant?.email}`} style={{ color: 'var(--teal-700)' }}>
                                      {app.contactEmail || app.applicant?.email}
                                    </a>
                                  ) : '—'}
                                </td>
                                <td>
                                  {app.resumeUrl ? (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                                        View
                                      </a>
                                      <a
                                        href={toDownloadUrl(app.resumeUrl, `${app.applicant?.name || 'applicant'}-CV`)}
                                        className="btn btn--ghost btn--sm"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  ) : '—'}
                                </td>
                                <td>
                                  {app.aiAnalysis ? (
                                    <button className="btn btn--outline-teal btn--sm" onClick={() => toggleExpanded(app._id)}>
                                      <AiIcon size={13} /> {expandedIds.includes(app._id) ? 'Hide' : 'View'}
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn--outline-teal btn--sm"
                                      disabled={analyzingId === app._id}
                                      onClick={() => handleAnalyze(app._id)}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                    >
                                      {analyzingId === app._id ? 'Analyzing…' : (<><AiIcon size={13} /> Analyze</>)}
                                    </button>
                                  )}
                                </td>
                                <td><StatusPill status={app.status} /></td>
                                <td>
                                  <select
                                    value={app.status}
                                    disabled={updatingId === app._id}
                                    onChange={(e) => handleStatusChange(app, e.target.value)}
                                    style={{ border: '1.5px solid var(--line)', borderRadius: 6, padding: '6px 8px', fontSize: 13 }}
                                  >
                                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                              </tr>
                              {analyzeErrorId === app._id && (
                                <tr>
                                  <td colSpan={9} style={{ background: '#FFE9E1' }}>
                                    <span style={{ color: 'var(--coral-dark)', fontSize: 13 }}>
                                      Could not generate an analysis right now. Please try again in a moment.
                                    </span>
                                  </td>
                                </tr>
                              )}
                              {expandedIds.includes(app._id) && app.aiAnalysis && (
                                <tr>
                                  <td colSpan={9} style={{ background: 'var(--teal-100)' }}>
                                    <div style={{ padding: '8px 4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <strong style={{ fontSize: 13, color: 'var(--teal-700)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                          <AiIcon size={14} /> AI fit assessment
                                        </strong>
                                        <button
                                          className="btn btn--ghost btn--sm"
                                          disabled={analyzingId === app._id}
                                          onClick={() => handleAnalyze(app._id, true)}
                                        >
                                          {analyzingId === app._id ? 'Re-analyzing…' : 'Re-analyze'}
                                        </button>
                                      </div>
                                      <p style={{ fontSize: 13.5, color: 'var(--ink)', whiteSpace: 'pre-line', lineHeight: 1.6, margin: 0 }}>
                                        {app.aiAnalysis}
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="card-list">
                      {applications.map((app) => (
                        <div className="data-card" key={app._id}>
                          <div className="data-card__top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar src={app.applicant?.profilePictureUrl} name={app.applicant?.name} size={36} />
                              <div>
                                <div className="data-card__title">{app.applicant?.name || 'Unknown applicant'}</div>
                                <div className="data-card__sub">{app.job?.title || '—'}</div>
                              </div>
                            </div>
                            <StatusPill status={app.status} />
                          </div>
                          <div className="data-card__row">
                            <span className="data-card__row-label">Applied</span>
                            <span>{formatDate(app.createdAt)}</span>
                          </div>
                          <div className="data-card__row">
                            <span className="data-card__row-label">Phone</span>
                            {app.phone ? (
                              <a href={`tel:${app.phone}`} style={{ color: 'var(--teal-700)', fontWeight: 600 }}>{app.phone}</a>
                            ) : <span>—</span>}
                          </div>
                          <div className="data-card__row">
                            <span className="data-card__row-label">Email</span>
                            {app.contactEmail || app.applicant?.email ? (
                              <a href={`mailto:${app.contactEmail || app.applicant?.email}`} style={{ color: 'var(--teal-700)', fontWeight: 600 }}>
                                {app.contactEmail || app.applicant?.email}
                              </a>
                            ) : <span>—</span>}
                          </div>
                          <div className="data-card__row">
                            <span className="data-card__row-label">Resume</span>
                            {app.resumeUrl ? (
                              <span style={{ display: 'flex', gap: 12 }}>
                                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal-700)', fontWeight: 600 }}>
                                  View
                                </a>
                                <a
                                  href={toDownloadUrl(app.resumeUrl, `${app.applicant?.name || 'applicant'}-CV`)}
                                  style={{ color: 'var(--teal-700)', fontWeight: 600 }}
                                >
                                  Download
                                </a>
                              </span>
                            ) : <span>—</span>}
                          </div>
                          <div className="data-card__row" style={{ alignItems: 'center' }}>
                            <span className="data-card__row-label">AI Fit</span>
                            {app.aiAnalysis ? (
                              <button className="btn btn--outline-teal btn--sm" onClick={() => toggleExpanded(app._id)}>
                                <AiIcon size={13} /> {expandedIds.includes(app._id) ? 'Hide' : 'View'}
                              </button>
                            ) : (
                              <button
                                className="btn btn--outline-teal btn--sm"
                                disabled={analyzingId === app._id}
                                onClick={() => handleAnalyze(app._id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                              >
                                {analyzingId === app._id ? 'Analyzing…' : (<><AiIcon size={13} /> Analyze</>)}
                              </button>
                            )}
                          </div>
                          {analyzeErrorId === app._id && (
                            <p style={{ color: 'var(--coral-dark)', fontSize: 12.5, marginTop: 6 }}>
                              Could not generate an analysis right now. Please try again.
                            </p>
                          )}
                          {expandedIds.includes(app._id) && app.aiAnalysis && (
                            <div style={{ background: 'var(--teal-100)', borderRadius: 8, padding: 12, marginTop: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <strong style={{ fontSize: 12.5, color: 'var(--teal-700)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <AiIcon size={13} /> AI fit assessment
                                </strong>
                                <button
                                  className="btn btn--ghost btn--sm"
                                  disabled={analyzingId === app._id}
                                  onClick={() => handleAnalyze(app._id, true)}
                                >
                                  {analyzingId === app._id ? '…' : 'Re-analyze'}
                                </button>
                              </div>
                              <p style={{ fontSize: 13, color: 'var(--ink)', whiteSpace: 'pre-line', lineHeight: 1.6, margin: 0 }}>
                                {app.aiAnalysis}
                              </p>
                            </div>
                          )}
                          <div className="data-card__row" style={{ alignItems: 'center' }}>
                            <span className="data-card__row-label">Update status</span>
                            <select
                              value={app.status}
                              disabled={updatingId === app._id}
                              onChange={(e) => handleStatusChange(app, e.target.value)}
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon="🔔"
                    title="No applicants yet"
                    description="Once job seekers apply to your postings, they'll show up here — with their CV and an AI fit summary."
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}