import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories, jobTypes } from '../data/mockJobs.js' // static option lists only
import { createJob } from '../api/jobs.js'

export default function PostJob() {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', location: '', type: 'Full-time', remote: 'On-site', category: 'Engineering',
    salary: '', closingAt: '', description: '', responsibilities: '', requirements: '',
  })

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

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
      })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish this job. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <span className="eyebrow">Job posted</span>
        <h1 style={{ fontSize: 28, margin: '12px 0' }}>Your job posting is live</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
          "{form.title}" has been added to the jobs board. You can manage applicants from your dashboard.
        </p>
        <button className="btn btn--pine" onClick={() => navigate('/employer')}>Go to dashboard</button>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 72, maxWidth: 720 }}>
      <span className="eyebrow">New posting</span>
      <h1 style={{ fontSize: 28, marginTop: 8, marginBottom: 28 }}>Post a job vacancy</h1>

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
          <textarea id="responsibilities" value={form.responsibilities} onChange={update('responsibilities')} placeholder={'One per line, e.g.\nBuild and maintain the frontend\nWrite tests'} />
          <span className="hint">One responsibility per line.</span>
        </div>

        <div className="form-field">
          <label htmlFor="requirements">Requirements</label>
          <textarea id="requirements" value={form.requirements} onChange={update('requirements')} placeholder={'One per line, e.g.\n2+ years experience\nStrong communication skills'} />
          <span className="hint">One requirement per line.</span>
        </div>

        {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

        <button className="btn btn--coral btn--block" type="submit" disabled={submitting}>
          {submitting ? 'Publishing…' : 'Publish job posting'}
        </button>
      </form>
    </div>
  )
}