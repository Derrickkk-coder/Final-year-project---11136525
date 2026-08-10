import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateProfile } from '../api/auth.js'
import { uploadImageToCloudinary } from '../api/cloudinary.js'
import Avatar from '../components/Avatar.jsx'
import DashboardShell from '../components/DashboardShell.jsx'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

export default function CompanyProfile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    company: user?.company || '',
    companyDescription: user?.companyDescription || '',
    companyWebsite: user?.companyWebsite || '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(user?.profilePictureUrl || '')
  const [imageError, setImageError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setSaved(false)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setImageError('')
    setSaved(false)
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Please upload a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image is too large — please keep it under 2MB.')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!form.name.trim()) {
      setError('Name cannot be empty.')
      return
    }

    let profilePictureUrl = user?.profilePictureUrl || ''

    if (imageFile) {
      setUploading(true)
      try {
        profilePictureUrl = await uploadImageToCloudinary(imageFile)
      } catch {
        setError('Could not upload your photo. Please try again.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    setSaving(true)
    try {
      const data = await updateProfile({ ...form, profilePictureUrl })
      updateUser(data.user)
      setImageFile(null)
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell eyebrow="Account" title="Company profile">
        <form className="panel" style={{ maxWidth: 560 }} onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Profile picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar src={imagePreview} name={form.name} size={64} />
              <div>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
                {imageError && <div className="hint" style={{ color: 'var(--rust)' }}>{imageError}</div>}
              </div>
            </div>
          </div>

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

          <button className="btn btn--pine" type="submit" disabled={saving || uploading}>
            {uploading ? 'Uploading photo…' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
    </DashboardShell>
  )
}