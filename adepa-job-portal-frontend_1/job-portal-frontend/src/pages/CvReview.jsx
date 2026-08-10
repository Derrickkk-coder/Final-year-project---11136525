import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import ScoreRing, { toneForScore } from '../components/ScoreRing.jsx'
import EmptyState from '../components/EmptyState.jsx'
import AiIcon from '../components/AiIcon.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'
import { fetchCvAnalysis, analyzeCv } from '../api/cv.js'
import { fetchJobs } from '../api/jobs.js'
import DashboardShell from '../components/DashboardShell.jsx'

function ScoreBar({ name, score, comment }) {
  return (
    <div className="score-bar">
      <div className="score-bar__top">
        <span className="score-bar__name">{name}</span>
        <span className="score-bar__value">{score}%</span>
      </div>
      <div className="score-bar__track">
        <div
          className="score-bar__fill"
          style={{ width: `${score}%`, background: toneForScore(score) }}
        />
      </div>
      {comment && <p className="score-bar__comment">{comment}</p>}
    </div>
  )
}

export default function CvReview() {
  const { user } = useAuth()
  const toast = useToast()

  const [analysis, setAnalysis] = useState(null)
  const [stale, setStale] = useState(false)
  const [hasCv, setHasCv] = useState(Boolean(user?.resumeUrl))
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  // Job comparison is a separate, explicit action — it isn't cached, so it only
  // ever runs when the user asks for it.
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [comparison, setComparison] = useState(null)
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    fetchCvAnalysis()
      .then((data) => {
        setHasCv(data.hasCv)
        setAnalysis(data.analysis)
        setStale(Boolean(data.stale))
      })
      .catch(() => toast.error('Could not load your CV review right now.'))
      .finally(() => setLoading(false))

    fetchJobs({ limit: 100 })
      .then((data) => setJobs(data.jobs))
      .catch(() => setJobs([]))
  }, [])

  const runAnalysis = async (force = false) => {
    setRunning(true)
    try {
      const data = await analyzeCv({ force })
      setAnalysis(data.analysis)
      setStale(false)
      toast.success(data.cached ? 'Showing your saved review.' : 'CV review complete.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not analyse your CV. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  const runComparison = async () => {
    if (!selectedJobId) return
    setComparing(true)
    setComparison(null)
    try {
      const data = await analyzeCv({ jobId: selectedJobId })
      setComparison({ ...data.analysis, job: jobs.find((j) => j._id === selectedJobId) })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not compare your CV. Please try again.')
    } finally {
      setComparing(false)
    }
  }

  return (
    <DashboardShell eyebrow="AI tools" title="CV review">
        {loading && <SkeletonRows count={4} height={56} />}

        {!loading && !hasCv && (
          <EmptyState
            icon="📄"
            title="No CV to review yet"
            description="Upload your CV as a PDF and we'll score it, then tell you what to fix before you apply anywhere."
            action={<Link to="/profile" className="btn btn--coral">Upload your CV</Link>}
          />
        )}

        {!loading && hasCv && (
          <>
            {stale && (
              <div className="panel" style={{ background: '#FFF3E0', border: '1px solid #F0D9A8', marginBottom: 20 }}>
                <strong style={{ color: '#8A5A0F' }}>This review is out of date.</strong>
                <p style={{ color: '#8A5A0F', fontSize: 'var(--text-base)', margin: '4px 0 0' }}>
                  You've replaced your CV since it was written. Run it again for scores that match
                  the file employers actually see.
                </p>
              </div>
            )}

            {!analysis && (
              <div className="panel cv-start">
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 6 }}>Score my CV</h2>
                  <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-base)', margin: 0, maxWidth: '56ch' }}>
                    We'll read your CV and score it across five areas, then give you a short list of
                    specific things to change. Takes a few seconds.
                  </p>
                </div>
                <button className="btn btn--coral btn--shine" disabled={running} onClick={() => runAnalysis(false)}>
                  {running ? 'Analysing…' : <><AiIcon size={14} /> Analyse my CV</>}
                </button>
              </div>
            )}

            {analysis && (
              <>
                <div className="panel cv-score">
                  <ScoreRing value={analysis.overallScore} size={104} thickness={11} suffix="" label="/ 100" />
                  <div className="cv-score__body">
                    <h2 className="cv-score__title">CV score: {analysis.overallScore}/100</h2>
                    <p className="cv-score__text">
                      Scored across skills, experience, education, formatting and how well-targeted
                      your CV is. Work down the suggestions below, then run it again.
                    </p>
                    <button className="btn btn--ghost btn--sm" disabled={running} onClick={() => runAnalysis(true)}>
                      {running ? 'Re-analysing…' : 'Re-analyse'}
                    </button>
                  </div>
                </div>

                <div className="panel" style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-5)' }}>Breakdown</h2>
                  {analysis.areas?.map((area) => (
                    <ScoreBar key={area.name} {...area} />
                  ))}
                </div>

                {analysis.suggestions?.length > 0 && (
                  <div className="panel cv-list" style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Suggestions</h2>
                    <ul className="cv-list__items">
                      {analysis.suggestions.map((s) => (
                        <li key={s} className="cv-list__item is-todo">
                          <span aria-hidden="true">→</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.strengths?.length > 0 && (
                  <div className="panel cv-list" style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>What's already working</h2>
                    <ul className="cv-list__items">
                      {analysis.strengths.map((s) => (
                        <li key={s} className="cv-list__item is-good">
                          <span aria-hidden="true">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* ---- CV vs a specific job ---- */}
            <div className="panel">
              <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 6 }}>
                How well does my CV fit a specific job?
              </h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-base)', marginTop: 0 }}>
                Pick an open role and we'll compare your CV against that posting directly.
              </p>

              <div className="cv-compare">
                <div className="form-field" style={{ marginBottom: 0, flex: 1, minWidth: 220 }}>
                  <label htmlFor="compare-job">Job</label>
                  <select
                    id="compare-job"
                    value={selectedJobId}
                    onChange={(e) => { setSelectedJobId(e.target.value); setComparison(null) }}
                  >
                    <option value="">Select a role…</option>
                    {jobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title} — {job.company}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn--outline-teal"
                  disabled={!selectedJobId || comparing}
                  onClick={runComparison}
                >
                  {comparing ? 'Comparing…' : 'Compare'}
                </button>
              </div>

              {comparison && (
                <div className="cv-compare__result">
                  <div className="cv-compare__head">
                    <ScoreRing value={comparison.jobMatch} size={84} thickness={9} />
                    <div>
                      <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 4 }}>
                        CV–job match: {comparison.jobMatch}%
                      </h3>
                      <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', margin: 0 }}>
                        {comparison.job?.title} at {comparison.job?.company}
                      </p>
                    </div>
                  </div>

                  {comparison.jobMatchNotes && (
                    <p className="cv-compare__notes">{comparison.jobMatchNotes}</p>
                  )}

                  {comparison.suggestions?.length > 0 && (
                    <ul className="cv-list__items" style={{ marginTop: 'var(--space-4)' }}>
                      {comparison.suggestions.map((s) => (
                        <li key={s} className="cv-list__item is-todo">
                          <span aria-hidden="true">→</span> {s}
                        </li>
                      ))}
                    </ul>
                  )}

                  {comparison.job && (
                    <Link
                      to={`/jobs/${comparison.job._id}`}
                      className="btn btn--coral btn--sm"
                      style={{ marginTop: 'var(--space-5)' }}
                    >
                      Apply for this role
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}
    </DashboardShell>
  )
}
