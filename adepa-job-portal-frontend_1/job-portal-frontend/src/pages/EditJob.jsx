import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { categories, jobTypes, experienceLevels } from '../data/mockJobs.js' // static option lists only
import { fetchJobById, updateJob } from '../api/jobs.js'
import { useAuth } from '../context/AuthContext.jsx'
import SkillsInput from '../components/SkillsInput.jsx'

export default function EditJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', location: '', type: 'Full-time', remote: 'On-site', category: 'Engineering',
    salary: '', closingAt: '', description: '', responsibilities: '', requirements: '',
    skills: [], experienceLevel: '',
  })

  useEffect(() => {
    fetchJobById(id)
      .then((data) => {
        const job = data.job

        const postedById = job.postedBy?._id || job.postedBy
        if (postedById && postedById !== user?._id) {
          setForbidden(true)
          return
        }

        setForm({
          title: job.title || '',
          location: job.location || '',
          type: job.type || 'Full-time',
          remote: job.remote || 'On-site',
          category: job.category || 'Engineering',
          salary: job.salary || '',
          closingAt: job.closingAt ? job.closingAt.slice(0, 10) : '',
          description: job.description || '',
          responsibilities: (job.responsibilities || []).join('\n'),
          requirements: (job.requirements || []).join('\n'),
          skills: job.skills || [],
          experienceLevel: job.experienceLevel || '',
        })
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true)
        else setForbidden(true)
      })
      .finally(() => setLoading(false))
  }, [id, user])

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const setSkills = (skills) => setForm((f) => ({ ...f, skills }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.location || !form.closingAt || !form.description) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    try {
      await updateJob(id, {
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
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your changes. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
        Loading job…
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <span className="eyebrow">Not found</span>
        <h1 style={{ fontSize: 26, margin: '12px 0' }}>This job doesn't exist</h1>
        <Link to="/employer" className="btn btn--outline-pine">Back to dashboard</Link>
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <span className="eyebrow">Not allowed</span>
        <h1 style={{ fontSize: 26, margin: '12px 0' }}>You can only edit jobs you posted</h1>
        <Link to="/employer" className="btn btn--outline-pine">Back to dashboard</Link>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <span className="eyebrow">Saved</span>
        <h1 style={{ fontSize: 28, margin: '12px 0' }}>Your changes are live</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
          "{form.title}" has been updated.
        </p>
        <button className="btn btn--pine" onClick={() => navigate('/employer')}>Go to dashboard</button>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 72, maxWidth: 720 }}>
      <span className="eyebrow">Edit posting</span>
      <h1 style={{ fontSize: 28, marginTop: 8, marginBottom: 28 }}>Edit job vacancy</h1>

      <form className="panel" onSubmit={handleSubmit}>
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
            <select id="type" value={form.type} onChange={update('type')}>
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

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="salary">Salary range</label>
            <input id="salary" value={form.salary} onChange={update('salary')} placeholder="e.g. GHS 6,000 – 9,000" />
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
          <textarea id="responsibilities" value={form.responsibilities} onChange={update('responsibilities')} placeholder={'One per line'} />
          <span className="hint">One responsibility per line.</span>
        </div>

        <div className="form-field">
          <label htmlFor="requirements">Requirements</label>
          <textarea id="requirements" value={form.requirements} onChange={update('requirements')} placeholder={'One per line'} />
          <span className="hint">One requirement per line.</span>
        </div>

        <div className="form-field">
          <label htmlFor="job-skills">Required skills</label>
          <SkillsInput
            id="job-skills"
            skills={form.skills}
            onChange={setSkills}
            hint="Press Enter or comma after each skill. Job seekers are matched against these."
          />
        </div>

        {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--coral" type="submit" disabled={submitting} style={{ flex: 1 }}>
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
          <Link to="/employer" className="btn btn--ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}