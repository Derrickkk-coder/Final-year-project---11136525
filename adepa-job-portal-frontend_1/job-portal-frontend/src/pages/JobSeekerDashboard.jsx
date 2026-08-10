import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import StatusPill from '../components/StatusPill.jsx'
import JobCard from '../components/JobCard.jsx'
import RecommendedJobCard from '../components/RecommendedJobCard.jsx'
import interviewFormat from '../utils/interviewFormat.js'
import NotificationsPanel from '../components/NotificationsPanel.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonJobList, SkeletonRows } from '../components/Skeleton.jsx'
import { fetchMyApplications } from '../api/applications.js'
import { fetchRecommendedJobs } from '../api/jobs.js'
import DashboardShell, { StatCard } from '../components/DashboardShell.jsx'
import ActivityChart from '../components/ActivityChart.jsx'
import { dailyCounts, activeDayCount } from '../utils/activitySeries.js'
import { FileIcon, ClockIcon, EyeIcon, CheckIcon } from '../components/DashboardIcons.jsx'

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
  const [studentMode, setStudentMode] = useState(false)
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
        setStudentMode(Boolean(data.studentMode))
      })
      .catch(() => setRecommended([]))
      .finally(() => setRecommendedLoading(false))
  }, [])

  // Only interviews still ahead of us, soonest first
  const upcomingInterviews = applications
    .filter((a) => a.interview?.scheduledAt && new Date(a.interview.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.interview.scheduledAt) - new Date(b.interview.scheduledAt))

  // Built from the applications already fetched - no extra request
  const activity = dailyCounts(applications, { days: 14 })
  const recentApplications = applications.slice(0, 5)

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    review: applications.filter((a) => a.status === 'review').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
  }

  return (
    <DashboardShell
      eyebrow="Welcome back"
      title={user?.name || 'Dashboard'}
      actions={<Link to="/jobs" className="btn btn--pine">Find more jobs</Link>}
    >
        <div className="dash__stats">
          <StatCard value={counts.total} label="Total applications" icon={FileIcon} tone="lime" />
          <StatCard value={counts.pending} label="Pending review" icon={ClockIcon} tone="teal" />
          <StatCard value={counts.review} label="In review" icon={EyeIcon} tone="teal" />
          <StatCard value={counts.accepted} label="Accepted" icon={CheckIcon} tone="lime" />
        </div>

        <div className="dash__cols">
          <section className="card">
            <div className="card__head">
              <h2 className="card__title">Applications sent</h2>
              <p className="card__note">Last 14 days</p>
            </div>
            {/* Three points is a shape read into noise, so below that the card
                says so rather than drawing a line */}
            {activeDayCount(activity) >= 3 ? (
              <ActivityChart series={activity} label="Applications" unit="application" />
            ) : (
              <p className="chart__empty">
                Not enough activity to chart yet - apply to a few roles and your
                pattern will show up here.
              </p>
            )}
          </section>

          <section className="card">
            <div className="card__head">
              <h2 className="card__title">Recent applications</h2>
            </div>
            {recentApplications.length > 0 ? (
              <div className="mini-list">
                {recentApplications.map((app) => (
                  <div className="mini-item" key={app._id}>
                    <span className="mini-item__mark">
                      {(app.job?.company || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="mini-item__body">
                      <Link to={`/jobs/${app.job?._id}`} className="mini-item__title">
                        {app.job?.title || 'Job no longer available'}
                      </Link>
                      <span className="mini-item__meta">
                        {app.job?.company || '-'} - {formatDate(app.createdAt)}
                      </span>
                    </span>
                    <span className="mini-item__end"><StatusPill status={app.status} /></span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="chart__empty">Nothing yet.</p>
            )}
          </section>
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
                    {interviewFormat(app.interview)}
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
              {recommendedBasis === 'student'
                ? 'Opportunities for students & graduates'
                : recommendedBasis === 'skills'
                  ? 'Recommended jobs for you'
                  : 'Jobs you might like'}
            </h2>
            {/* Say so when student mode is reordering the list, so a lower match
                appearing above a higher one is explained rather than puzzling */}
            {studentMode && recommendedBasis !== 'student' && (
              <p style={{ color: 'var(--success)', fontSize: 'var(--text-sm)', margin: '0 0 4px', fontWeight: 600 }}>
                Student mode on — internships, national service and entry-level roles come first.
              </p>
            )}
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
              {recommendedBasis === 'student' && (
                <>
                  Internships, national service and entry-level roles.{' '}
                  <Link to="/profile" style={{ color: 'var(--teal-700)', fontWeight: 600 }}>
                    Add your skills
                  </Link>{' '}
                  to get these matched to you.
                </>
              )}
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
    </DashboardShell>
  )
}