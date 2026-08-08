import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import InterviewCalendar, { dateKey } from '../components/InterviewCalendar.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Avatar from '../components/Avatar.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'
import { fetchMyInterviews } from '../api/applications.js'
import interviewFormat from '../utils/interviewFormat.js'

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatLongDay(key) {
  // Midday avoids any chance of a DST or offset edge flipping the date
  return new Date(`${key}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Interviews() {
  const { user } = useAuth()
  const toast = useToast()
  const isEmployer = user?.role === 'employer'

  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState(null)

  useEffect(() => {
    fetchMyInterviews()
      .then((data) => {
        setInterviews(data.interviews)

        // Land on something useful: the next upcoming interview if there is one,
        // otherwise today. Opening on an empty today would look broken when
        // there are interviews a fortnight away.
        const now = new Date()
        const next = data.interviews.find((a) => new Date(a.interview.scheduledAt) >= now)
        setSelectedKey(dateKey(next ? next.interview.scheduledAt : now))
      })
      .catch(() => toast.error('Could not load your interviews right now.'))
      .finally(() => setLoading(false))
  }, [])

  const selectedDay = useMemo(
    () => interviews.filter((a) => dateKey(a.interview.scheduledAt) === selectedKey),
    [interviews, selectedKey]
  )

  const upcomingCount = interviews.filter(
    (a) => new Date(a.interview.scheduledAt) >= new Date()
  ).length

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        {isEmployer ? (
          <div className="dash-sidebar__group">
            <span className="dash-sidebar__label">Employer</span>
            <a href="/employer">My job postings</a>
            <a href="/interviews" className="active">Interviews</a>
            <a href="/employer/profile">Company profile</a>
          </div>
        ) : (
          <>
            <div className="dash-sidebar__group">
              <span className="dash-sidebar__label">Job seeker</span>
              <a href="/dashboard">My applications</a>
              <a href="/jobs">Browse jobs</a>
              <a href="/interviews" className="active">Interviews</a>
            </div>
            <div className="dash-sidebar__group">
              <span className="dash-sidebar__label">Account</span>
              <a href="/profile">My profile</a>
              <a href="/cv-review">CV review</a>
            </div>
          </>
        )}
      </aside>

      <div className="dash-main">
        <div className="dash-header">
          <div>
            <span className="eyebrow">Schedule</span>
            <h1 style={{ fontSize: 26, marginTop: 6 }}>Interviews</h1>
            {!loading && (
              <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', margin: '4px 0 0' }}>
                {upcomingCount === 0
                  ? 'Nothing coming up.'
                  : `${upcomingCount} upcoming ${upcomingCount === 1 ? 'interview' : 'interviews'}.`}
              </p>
            )}
          </div>
        </div>

        {loading && <SkeletonRows count={3} height={90} />}

        {!loading && interviews.length === 0 && (
          <EmptyState
            icon="🗓️"
            title="No interviews scheduled"
            description={
              isEmployer
                ? 'Shortlist a candidate and schedule an interview — it will appear here and on their dashboard.'
                : "When an employer invites you to an interview, it'll show up here with the time and joining details."
            }
            action={
              isEmployer
                ? <Link to="/employer" className="btn btn--coral">Go to your postings</Link>
                : <Link to="/jobs" className="btn btn--coral">Browse open roles</Link>
            }
          />
        )}

        {!loading && interviews.length > 0 && (
          <div className="cal-layout">
            <div className="panel">
              <InterviewCalendar
                interviews={interviews}
                selectedKey={selectedKey}
                onSelectDay={setSelectedKey}
              />
            </div>

            <div className="panel cal-day">
              <h2 className="cal-day__title">
                {selectedKey ? formatLongDay(selectedKey) : 'Pick a day'}
              </h2>

              {selectedDay.length === 0 ? (
                <p className="cal-day__empty">No interviews on this day.</p>
              ) : (
                selectedDay.map((a) => {
                  const past = new Date(a.interview.scheduledAt) < new Date()
                  return (
                    <div className={`cal-item ${past ? 'is-past' : ''}`} key={a._id}>
                      <div className="cal-item__time">{formatTime(a.interview.scheduledAt)}</div>

                      <div className="cal-item__body">
                        <strong className="cal-item__role">{a.job?.title}</strong>

                        {isEmployer ? (
                          <span className="cal-item__who">
                            <Avatar
                              src={a.applicant?.profilePictureUrl}
                              name={a.applicant?.name}
                              size={22}
                            />
                            {a.applicant?.name || 'Unknown candidate'}
                          </span>
                        ) : (
                          <span className="cal-item__who">{a.job?.company}</span>
                        )}

                        <span className="cal-item__mode">{interviewFormat(a.interview)}</span>

                        {a.interview.details && (
                          <span className="cal-item__details">
                            {/^https?:\/\//.test(a.interview.details) ? (
                              <a href={a.interview.details} target="_blank" rel="noopener noreferrer">
                                {a.interview.details}
                              </a>
                            ) : a.interview.details}
                          </span>
                        )}

                        {a.interview.note && <p className="cal-item__note">{a.interview.note}</p>}

                        {isEmployer && a.job && (
                          <Link
                            to={`/employer/jobs/${a.job._id}/candidates`}
                            className="btn btn--ghost btn--sm"
                            style={{ marginTop: 'var(--space-3)', alignSelf: 'flex-start' }}
                          >
                            Open candidates
                          </Link>
                        )}
                      </div>

                      {past && <span className="cal-item__past-tag">Past</span>}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
