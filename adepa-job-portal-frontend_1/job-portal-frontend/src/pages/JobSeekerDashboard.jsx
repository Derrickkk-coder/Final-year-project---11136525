import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import StatusPill from '../components/StatusPill.jsx'
import JobCard from '../components/JobCard.jsx'
import RecommendedJobCard from '../components/RecommendedJobCard.jsx'
import NotificationsPanel from '../components/NotificationsPanel.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonJobList, SkeletonRows } from '../components/Skeleton.jsx'
import { fetchMyApplications } from '../api/applications.js'
import { fetchRecommendedJobs } from '../api/jobs.js'

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function JobSeekerDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [recommended, setRecommended] = useState([])
  const [recommendedBasis, setRecommendedBasis] = useState('recent')
  const [recommendedLoading, setRecommendedLoading] = useState(true)

  useEffect(() => {
    fetchMyApplications()
      .then((data) => setApplications(data.applications))
      .catch(() => setError('Could not load your applications right now.'))
      .finally(() => setLoading(false))

    fetchRecommendedJobs()
      .then((data) => {
        setRecommended(data.jobs)
        setRecommendedBasis(data.basis || 'recent')
      })
      .catch(() => setRecommended([]))
      .finally(() => setRecommendedLoading(false))
  }, [])

  // Only interviews still ahead of us, soonest first
  const upcomingInterviews = applications
    .filter((a) => a.interview?.scheduledAt && new Date(a.interview.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.interview.scheduledAt) - new Date(b.interview.scheduledAt))

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
        <div className="dash-sidebar__group">
          <span className="dash-sidebar__label">Account</span>
          <a href="/profile">My profile</a>
          <a href="/cv-review">CV review</a>
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

        {/* Above "Jobs you might like" — a status change on something you've
            already applied for matters more than a new suggestion. Renders
            nothing at all when there are no notifications. */}
        <NotificationsPanel />

        {/* Upcoming interviews outrank everything else on this page — past ones
            are filtered out rather than lingering as clutter. */}
        {upcomingInterviews.length > 0 && (
          <div className="panel interview-panel">
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
              {upcomingInterviews.length === 1 ? 'Upcoming interview' : 'Upcoming interviews'}
            </h2>
            {upcomingInterviews.map((app) => (
              <div className="interview-row" key={app._id}>
                <div className="interview-row__when">
                  <span className="interview-row__date">
                    {new Date(app.interview.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="interview-row__time">
                    {new Date(app.interview.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="interview-row__body">
                  <strong>{app.job?.title || 'Role no longer listed'}</strong>
                  <span className="interview-row__company">{app.job?.company}</span>
                  <span className="interview-row__mode">
                    {app.interview.mode}
                    {app.interview.details ? ` · ${app.interview.details}` : ''}
                  </span>
                  {app.interview.note && <p className="interview-row__note">{app.interview.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {recommendedLoading && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>Finding roles for you…</h2>
            <SkeletonJobList count={2} />
          </div>
        )}

        {!recommendedLoading && recommended.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>
              {recommendedBasis === 'skills' ? 'Recommended jobs for you' : 'Jobs you might like'}
            </h2>
            {/* Captioned from the basis the API reports, so the heading never
                implies a skill match when the list is really just recent roles. */}
            <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 14 }}>
              {recommendedBasis === 'skills' && (
                <>
                  Matched against the skills on your profile.{' '}
                  <Link to="/profile" style={{ color: 'var(--teal-700)', fontWeight: 600 }}>
                    Update your skills
                  </Link>{' '}
                  to change these.
                </>
              )}
              {recommendedBasis === 'category' && "Based on the roles you've applied to before."}
              {recommendedBasis === 'recent' && (
                <>
                  The latest open roles.{' '}
                  <Link to="/profile" style={{ color: 'var(--teal-700)', fontWeight: 600 }}>
                    Add your skills
                  </Link>{' '}
                  to get matched recommendations instead.
                </>
              )}
            </p>
            {/* Skill-matched results get the explanatory card; the weaker
                fallbacks (category, recency) have no match to justify, so they
                use the ordinary job card. */}
            <div className="listings-grid">
              {recommended.map((job) =>
                recommendedBasis === 'skills'
                  ? <RecommendedJobCard key={job._id} job={job} />
                  : <JobCard key={job._id} job={job} />
              )}
            </div>
          </div>
        )}

        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Application history</h2>

        {loading && <SkeletonRows count={4} height={52} />}

        {!loading && error && (
          <EmptyState
            icon="⚠️"
            tone="error"
            title="Couldn't load your applications"
            description={error}
          />
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
            <EmptyState
              icon="📄"
              title="No applications yet"
              description="Once you apply for a role, you'll be able to track its status here — and we'll email you whenever an employer moves it forward."
              action={<Link to="/jobs" className="btn btn--coral">Browse open roles</Link>}
            />
          )
        )}
      </div>
    </div>
  )
}