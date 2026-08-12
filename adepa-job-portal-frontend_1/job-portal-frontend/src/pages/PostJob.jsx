import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { categories, jobTypes, experienceLevels } from '../data/mockJobs.js' // static option lists only
import { STUDENT_JOB_TYPES } from '../utils/studentFriendly.js'
import { createJob } from '../api/jobs.js'
import { useAuth } from '../context/AuthContext.jsx'
import SkillsInput from '../components/SkillsInput.jsx'
import DashboardShell from '../components/DashboardShell.jsx'

export default function PostJob() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', location: '', type: 'Full-time', remote: 'On-site', category: 'Engineering',
    salary: '', closingAt: '', description: '', responsibilities: '', requirements: '',
    skills: [], experienceLevel: '',
  })

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const setSkills = (skills) => setForm((f) => ({ ...f, skills }))

  const isStudentType = STUDENT_JOB_TYPES.includes(form.type)

  // Internships, National Service and graduate trainee roles don't carry a
  // seniority or a salary band, so switching into one of these types blanks
  // whatever was entered — otherwise it would sit hidden in state and still
  // get submitted. Only fires on an actual change, not on load, so opening
  // EditJob for a legacy posting that has both set doesn't wipe them the
  // moment the page opens; the server clears them on save regardless.
  const updateType = (e) => {
    const type = e.target.value
    setForm((f) => ({
      ...f,
      type,
      ...(STUDENT_JOB_TYPES.includes(type) ? { salary: '', experienceLevel: '' } : {}),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.location || !form.closingAt || !form.description) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    try {
      await createJob({
        title: form.title,
        location: form.location,
        type: form.type,
        remote: form.remote,
        category: form.category,
        salary: form.salary,
        closingAt: form.closingAt,
        description: form.description,
        responsibilities: form.responsibilities.split('\n').map((s) => s.trim()).filter(Boolean),
        requirements: form.requirements.split('\n').map((s) => s.trim()).filter(Boolean),
        skills: form.skills,
        experienceLevel: form.experienceLevel,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish this job. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (user?.employerStatus !== 'approved') {
    return (
      <DashboardShell eyebrow="New posting" title="Post a job">
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
        <span className="eyebrow">
          {user?.employerStatus === 'rejected' ? 'Account not approved' : 'Awaiting approval'}
        </span>
        <h1 style={{ fontSize: 26, margin: '12px 0' }}>
          {user?.employerStatus === 'rejected'
            ? "You can't post jobs yet"
            : "Your account is still awaiting admin approval"}
        </h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 24, maxWidth: '48ch', marginLeft: 'auto', marginRight: 'auto' }}>
          {user?.employerStatus === 'rejected'
            ? 'Your employer account was not approved. Contact support if you believe this is a mistake.'
            : "We're reviewing your employer account. You'll be able to post jobs as soon as it's approved."}
        </p>
        <Link to="/employer" className="btn btn--outline-pine">Back to dashboard</Link>
      </div>
    </DashboardShell>
    )
  }

  if (submitted) {
    return (
      <DashboardShell eyebrow="New posting" title="Post a job">
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
        <span className="eyebrow">Job posted</span>
        <h1 style={{ fontSize: 28, margin: '12px 0' }}>Your job posting is live</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
          "{form.title}" has been added to the jobs board. You can manage applicants from your dashboard.
        </p>
        <button className="btn btn--pine" onClick={() => navigate('/employer')}>Go to dashboard</button>
      </div>
    </DashboardShell>
    )
  }

  return (
    <DashboardShell eyebrow="New posting" title="Post a job vacancy">
      <form className="panel" style={{ maxWidth: 720 }} onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="title">Job title</label>
          <input id="title" value={form.title} onChange={update('title')} placeholder="e.g. Frontend Engineer" required />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={update('category')}>
              {categories.filter((c) => c !== 'All categories').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="type">Job type</label>
            <select id="type" value={form.type} onChange={updateType}>
              {jobTypes.filter((t) => t !== 'All types').map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="location">Location</label>
            <input id="location" value={form.location} onChange={update('location')} placeholder="e.g. Accra, GH" required />
          </div>
          <div className="form-field">
            <label htmlFor="remote">Work setting</label>
            <select id="remote" value={form.remote} onChange={update('remote')}>
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Remote</option>
            </select>
          </div>
        </div>

        {isStudentType ? (
          <div className="form-field">
            <label>Experience level</label>
            <p className="hint" style={{ marginTop: 0 }}>
              Not applicable — {form.type} roles go straight into the students &amp; graduates
              feed, so there's no level to set.
            </p>
          </div>
        ) : (
          <div className="form-field">
            <label htmlFor="experienceLevel">Experience level</label>
            <select id="experienceLevel" value={form.experienceLevel} onChange={update('experienceLevel')}>
              <option value="">Not specified</option>
              {experienceLevels.map((l) => <option key={l}>{l}</option>)}
            </select>
            <span className="hint">
              Marking a role Entry level puts it in the students &amp; graduates feed, alongside
              internships, national service and graduate trainee posts.
            </span>
          </div>
        )}

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="salary">Salary range</label>
            {isStudentType ? (
              // The row is a fixed two-column grid, so the field stays in place
              // rather than leaving closingAt stranded alone in it.
              <p className="hint" style={{ marginTop: 8 }}>Not applicable for {form.type} roles.</p>
            ) : (
              <input id="salary" value={form.salary} onChange={update('salary')} placeholder="e.g. GHS 6,000 – 9,000" />
            )}
          </div>
          <div className="form-field">
            <label htmlFor="closingAt">Application closing date</label>
            <input id="closingAt" type="date" value={form.closingAt} onChange={update('closingAt')} required />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="description">Job description</label>
          <textarea id="description" value={form.description} onChange={update('description')} placeholder="Describe the role…" required />
        </div>

        <div className="form-field">
          <label htmlFor="responsibilities">Responsibilities</label>
          <textarea id="responsibilities" value={form.responsibilities} onChange={update('responsibilities')} placeholder={'One per line, e.g.\nBuild and maintain the frontend\nWrite tests'} />
          <span className="hint">One responsibility per line.</span>
        </div>

        <div className="form-field">
          <label htmlFor="requirements">Requirements</label>
          <textarea id="requirements" value={form.requirements} onChange={update('requirements')} placeholder={'One per line, e.g.\n2+ years experience\nStrong communication skills'} />
          <span className="hint">One requirement per line.</span>
        </div>

        <div className="form-field">
          <label htmlFor="job-skills">Required skills</label>
          <SkillsInput
            id="job-skills"
            skills={form.skills}
            onChange={setSkills}
            hint="Press Enter or comma after each skill. Job seekers are matched against these, so a tagged role reaches the right candidates."
          />
        </div>

        {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

        <button className="btn btn--coral btn--block" type="submit" disabled={submitting}>
          {submitting ? 'Publishing…' : 'Publish job posting'}
        </button>
      </form>
    </DashboardShell>
  )
}