import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchJobById } from '../api/jobs.js'
import { applyToJob } from '../api/applications.js'
import { uploadResumeToCloudinary } from '../api/cloudinary.js'
import { useAuth } from '../context/AuthContext.jsx'

const MAX_RESUME_SIZE = 5 * 1024 * 1024 // 5MB

export default function JobDetails() {
  const { id } = useParams()
  const { user, updateUser } = useAuth()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)
  const [serverError, setServerError] = useState(false)

  const [resumeFile, setResumeFile] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchJobById(id)
      .then((data) => setJob(data.job))
      .catch((err) => {
        if (err.response?.status === 404 || err.response?.status === 400) {
          setNotFoundError(true)
        } else {
          setServerError(true)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setResumeError('')
    setResumeFile(null)
    if (!file) return

    if (file.type !== 'application/pdf') {
      setResumeError('Please upload a PDF file.')
      return
    }
    if (file.size > MAX_RESUME_SIZE) {
      setResumeError('File is too large — please keep it under 5MB.')
      return
    }
    setResumeFile(file)
  }

  const handleApply = async () => {
    setApplyError('')

    let resumeUrlToSubmit = user?.resumeUrl || ''

    if (resumeFile) {
      setUploading(true)
      try {
        resumeUrlToSubmit = await uploadResumeToCloudinary(resumeFile)
      } catch {
        setApplyError('Could not upload your resume. Please check your connection and try again.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    if (!resumeUrlToSubmit) {
      setApplyError('Please attach your resume (PDF) before applying.')
      return
    }

    setApplying(true)
    try {
      await applyToJob(id, resumeUrlToSubmit)
      updateUser({ ...user, resumeUrl: resumeUrlToSubmit })
      setApplied(true)
    } catch (err) {
      const message = err.response?.data?.message
      if (err.response?.status === 409) {
        setApplied(true)
      } else {
        setApplyError(message || 'Could not submit your application. Please try again.')
      }
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
        Loading job…
      </div>
    )
  }

  if (serverError) {
    return (
      <div className="container" style={{ padding: '60px 24px' }}>
        <div className="empty-state">
          <h3>Something went wrong</h3>
          <p>We couldn't load this job right now. Please try again in a moment.</p>
          <Link to="/jobs" className="btn btn--outline-pine" style={{ marginTop: 16 }}>Back to jobs</Link>
        </div>
      </div>
    )
  }

  if (notFoundError || !job) {
    return (
      <div className="container" style={{ padding: '60px 24px' }}>
        <div className="empty-state">
          <h3>Job not found</h3>
          <p>This listing may have closed or been removed.</p>
          <Link to="/jobs" className="btn btn--outline-pine" style={{ marginTop: 16 }}>Back to jobs</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 72 }}>
      <Link to="/jobs" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>&larr; Back to all jobs</Link>

      <div className="panel" style={{ marginTop: 20, marginBottom: 32, background: 'var(--pine-deep)', color: 'var(--paper)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <span className="ticket__ref" style={{ color: 'rgba(255,255,255,0.7)' }}>REF {job.ref}</span>
            <h1 style={{ fontSize: 30, marginTop: 8, color: 'var(--paper)' }}>{job.title}</h1>
            <p style={{ color: 'rgba(238,241,236,0.75)', marginTop: 4 }}>{job.company}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="hero__stat-label">Closes</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>
              {new Date(job.closingAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="ticket__route" style={{ color: 'rgba(238,241,236,0.8)', marginTop: 24 }}>
          <span>{job.location}</span>
          <span className="dash" />
          <span>{job.remote}</span>
        </div>

        <div className="ticket__tags" style={{ marginTop: 18 }}>
          <span className="tag" style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff' }}>{job.type}</span>
          <span className="tag" style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff' }}>{job.category}</span>
          {job.salary && <span className="tag tag--gold">{job.salary}</span>}
        </div>
      </div>

      <div className="job-detail-grid">
        <div>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>About this role</h2>
            <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{job.description}</p>
          </section>

          {job.responsibilities?.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Responsibilities</h2>
              <ul style={{ color: 'var(--ink-soft)', lineHeight: 1.9, paddingLeft: 20 }}>
                {job.responsibilities.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}

          {job.requirements?.length > 0 && (
            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Requirements</h2>
              <ul style={{ color: 'var(--ink-soft)', lineHeight: 1.9, paddingLeft: 20 }}>
                {job.requirements.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <div className="panel job-detail-aside">
            <div className="hero__stat-label" style={{ marginBottom: 4 }}>Applicants so far</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--pine)', marginBottom: 20 }}>
              {job.applicantsCount || 0}
            </div>

            {!user && (
              <>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
                  Log in as a job seeker to apply for this role.
                </p>
                <Link to="/login" className="btn btn--pine btn--block">Log in to apply</Link>
              </>
            )}

            {user?.role === 'seeker' && !applied && (
              <>
                <div className="form-field">
                  <label htmlFor="resume">Resume (PDF)</label>
                  <input id="resume" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />

                  {resumeError && <span className="hint" style={{ color: 'var(--rust)' }}>{resumeError}</span>}

                  {!resumeFile && !resumeError && user?.resumeUrl && (
                    <span className="hint">
                      Using your saved resume —{' '}
                      <a href={user.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal-700)', fontWeight: 600 }}>
                        view it
                      </a>
                      , or choose a new file above to replace it.
                    </span>
                  )}

                  {resumeFile && <span className="hint">Selected: {resumeFile.name}</span>}
                </div>

                <button className="btn btn--coral btn--block" onClick={handleApply} disabled={applying || uploading}>
                  {uploading ? 'Uploading resume…' : applying ? 'Submitting…' : 'Apply for this role'}
                </button>
                {applyError && <p style={{ color: 'var(--rust)', fontSize: 13, marginTop: 10 }}>{applyError}</p>}
              </>
            )}

            {user?.role === 'seeker' && applied && (
              <div className="status-pill status-pill--pending" style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                Application submitted
              </div>
            )}

            {user?.role === 'employer' && (
              <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Employer accounts view applicants from the Employer Dashboard.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}