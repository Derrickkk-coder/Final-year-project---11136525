import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateProfile } from '../api/auth.js'
import { uploadImageToCloudinary } from '../api/cloudinary.js'
import Avatar from '../components/Avatar.jsx'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

export default function MyProfile() {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(user?.profilePictureUrl || '')
  const [imageError, setImageError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

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

    if (!name.trim()) {
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
      const data = await updateProfile({ name, profilePictureUrl })
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
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar__group">
          <span className="dash-sidebar__label">Job seeker</span>
          <a href="/dashboard">My applications</a>
          <a href="/jobs">Browse jobs</a>
        </div>
        <div className="dash-sidebar__group">
          <span className="dash-sidebar__label">Account</span>
          <a href="/profile" className="active">My profile</a>
        </div>
      </aside>

      <div className="dash-main">
        <div className="dash-header">
          <div>
            <span className="eyebrow">Account</span>
            <h1 style={{ fontSize: 26, marginTop: 6 }}>My profile</h1>
          </div>
        </div>

        <form className="panel" style={{ maxWidth: 480 }} onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Profile picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar src={imagePreview} name={name} size={64} />
              <div>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
                {imageError && <div className="hint" style={{ color: 'var(--rust)' }}>{imageError}</div>}
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} placeholder="e.g. Ama Serwaa" />
          </div>

          {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 14 }}>{error}</p>}
          {saved && <p style={{ color: 'var(--success)', fontSize: 13, marginBottom: 14 }}>Profile updated successfully.</p>}

          <button className="btn btn--pine" type="submit" disabled={saving || uploading}>
            {uploading ? 'Uploading photo…' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}