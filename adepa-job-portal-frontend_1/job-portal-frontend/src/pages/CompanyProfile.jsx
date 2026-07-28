import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateProfile } from '../api/auth.js'

export default function CompanyProfile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    company: user?.company || '',
    companyDescription: user?.companyDescription || '',
    companyWebsite: user?.companyWebsite || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!form.name.trim()) {
      setError('Name cannot be empty.')
      return
    }

    setSaving(true)
    try {
      const data = await updateProfile(form)
      updateUser(data.user)
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar__group">
          <span className="dash-sidebar__label">Employer</span>
          <a href="/employer">My job postings</a>
          <a href="/employer">Applicants</a>
        </div>
        <div className="dash-sidebar__group">
          <span className="dash-sidebar__label">Account</span>
          <a href="/employer/profile" className="active">Company profile</a>
        </div>
      </aside>

      <div className="dash-main">
        <div className="dash-header">
          <div>
            <span className="eyebrow">Account</span>
            <h1 style={{ fontSize: 26, marginTop: 6 }}>Company profile</h1>
          </div>
        </div>

        <form className="panel" style={{ maxWidth: 560 }} onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">Contact name</label>
            <input id="name" value={form.name} onChange={update('name')} placeholder="e.g. Ama Serwaa" />
            <span className="hint">The person managing this account — shown internally, not on job listings.</span>
          </div>

          <div className="form-field">
            <label htmlFor="company">Company name</label>
            <input id="company" value={form.company} onChange={update('company')} placeholder="e.g. Zaya Health" />
            <span className="hint">This is the name shown on all of your job listings.</span>
          </div>

          <div className="form-field">
            <label htmlFor="companyWebsite">Company website</label>
            <input id="companyWebsite" value={form.companyWebsite} onChange={update('companyWebsite')} placeholder="https://yourcompany.com" />
          </div>

          <div className="form-field">
            <label htmlFor="companyDescription">About the company</label>
            <textarea
              id="companyDescription"
              value={form.companyDescription}
              onChange={update('companyDescription')}
              placeholder="A few sentences about what your company does — shown to job seekers viewing your listings."
            />
          </div>

          {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 14 }}>{error}</p>}
          {saved && <p style={{ color: 'var(--success)', fontSize: 13, marginBottom: 14 }}>Profile updated successfully.</p>}

          <button className="btn btn--pine" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}