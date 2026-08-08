import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { updateProfile } from '../api/auth.js'
import { uploadImageToCloudinary } from '../api/cloudinary.js'
import Avatar from '../components/Avatar.jsx'
import ProfileCompletion from '../components/ProfileCompletion.jsx'
import CvCard from '../components/CvCard.jsx'
import EntryList from '../components/EntryList.jsx'
import SkillsInput from '../components/SkillsInput.jsx'
import { studentLevels } from '../data/mockJobs.js'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

const EDUCATION_FIELDS = [
  { key: 'institution', label: 'Institution', placeholder: 'e.g. University of Ghana' },
  { key: 'qualification', label: 'Qualification', placeholder: 'e.g. BSc Information Technology' },
  { key: 'startYear', label: 'From', placeholder: '2021', width: 'sm' },
  { key: 'endYear', label: 'To', placeholder: '2025', width: 'sm' },
]

const EXPERIENCE_FIELDS = [
  { key: 'company', label: 'Company', placeholder: 'e.g. Zaya Health' },
  { key: 'role', label: 'Role', placeholder: 'e.g. Frontend Developer' },
  { key: 'startYear', label: 'From', placeholder: '2023', width: 'sm' },
  { key: 'endYear', label: 'To', placeholder: 'Present', width: 'sm' },
  { key: 'summary', label: 'What you did', placeholder: 'A line or two on your work there.', textarea: true },
]

const CERTIFICATION_FIELDS = [
  { key: 'name', label: 'Certification', placeholder: 'e.g. AWS Cloud Practitioner' },
  { key: 'issuer', label: 'Issued by', placeholder: 'e.g. Amazon Web Services' },
  { key: 'year', label: 'Year', placeholder: '2024', width: 'sm' },
]

export default function MyProfile() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    skills: user?.skills || [],
    education: user?.education || [],
    experience: user?.experience || [],
    certifications: user?.certifications || [],
    student: {
      isStudent: user?.student?.isStudent || false,
      institution: user?.student?.institution || '',
      level: user?.student?.level || '',
      fieldOfStudy: user?.student?.fieldOfStudy || '',
      graduationYear: user?.student?.graduationYear || '',
    },
  })

  const setStudent = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, student: { ...f.student, [key]: value } }))
    setSaved(false)
  }

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(user?.profilePictureUrl || '')
  const [imageError, setImageError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Any edit invalidates the "saved" confirmation
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }
  const setField = (key) => (e) => set(key)(e.target.value)

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
      toast.success('Profile updated.')
    } catch (err) {
      const message = err.response?.data?.message || 'Could not save your changes. Please try again.'
      setError(message)
      toast.error(message)
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
          <a href="/cv-review">CV review</a>
        </div>
      </aside>

      <div className="dash-main">
        <div className="dash-header">
          <div>
            <span className="eyebrow">Account</span>
            <h1 style={{ fontSize: 26, marginTop: 6 }}>My profile</h1>
          </div>
        </div>

        {/* Reads from `user`, not `form`, so the percentage reflects what is
            actually saved rather than what's currently typed. */}
        <ProfileCompletion user={user} />

        {/* Outside the form: it saves on upload, and a nested submit would
            otherwise be ambiguous. */}
        <CvCard user={user} onChange={updateUser} />

        <form className="panel profile-form" onSubmit={handleSubmit}>
          <h2 className="profile-form__section">Basics</h2>

          <div className="form-field">
            <label>Profile photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar src={imagePreview} name={form.name} size={64} />
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
                {imageError && <div className="hint" style={{ color: 'var(--rust)' }}>{imageError}</div>}
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={setField('name')} placeholder="e.g. Ama Serwaa" />
          </div>

          <div className="form-field">
            <label htmlFor="bio">Short bio</label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={setField('bio')}
              maxLength={800}
              placeholder="A few lines on who you are and the kind of work you're looking for."
            />
            <span className="hint">{form.bio.length}/800 characters</span>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="location">Location</label>
              <input id="location" value={form.location} onChange={setField('location')} placeholder="e.g. Accra, Ghana" />
            </div>
            <div className="form-field">
              <label htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" value={form.phone} onChange={setField('phone')} placeholder="e.g. 059 208 1217" />
            </div>
          </div>

          <div className="form-field">
            <label>Email address</label>
            <input value={user?.email || ''} disabled readOnly />
            <span className="hint">
              Your login email can't be changed here — it's what your account is verified against.
            </span>
          </div>

          <h2 className="profile-form__section">Student or recent graduate</h2>

          <label className="student-toggle">
            <input
              type="checkbox"
              checked={form.student.isStudent}
              onChange={setStudent('isStudent')}
            />
            <span>
              <strong>I'm a student or recent graduate</strong>
              <span className="hint">
                Turning this on prioritises internships, national service and graduate trainee
                posts, and entry-level roles, in your recommendations.
              </span>
            </span>
          </label>

          {/* Only asked for once the toggle is on — no point collecting a level
              from someone who isn't a student. */}
          <div className={`collapsible ${form.student.isStudent ? 'is-open' : ''}`}>
            <div className="collapsible__inner">
              <div style={{ paddingTop: 'var(--space-5)' }}>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="institution">Institution</label>
                    <input
                      id="institution"
                      value={form.student.institution}
                      onChange={setStudent('institution')}
                      placeholder="e.g. University of Ghana"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="level">Level</label>
                    <select id="level" value={form.student.level} onChange={setStudent('level')}>
                      <option value="">Select a level…</option>
                      {studentLevels.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="fieldOfStudy">Field of study</label>
                    <input
                      id="fieldOfStudy"
                      value={form.student.fieldOfStudy}
                      onChange={setStudent('fieldOfStudy')}
                      placeholder="e.g. Information Technology"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="graduationYear">Graduating / graduated</label>
                    <input
                      id="graduationYear"
                      value={form.student.graduationYear}
                      onChange={setStudent('graduationYear')}
                      placeholder="e.g. 2026"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="profile-form__section">Skills</h2>
          <div className="form-field">
            <label htmlFor="skills">Your skills</label>
            <SkillsInput skills={form.skills} onChange={set('skills')} />
          </div>

          <h2 className="profile-form__section">Background</h2>

          <EntryList
            label="Education"
            entries={form.education}
            fields={EDUCATION_FIELDS}
            onChange={set('education')}
            addLabel="Add education"
          />

          <EntryList
            label="Work experience"
            entries={form.experience}
            fields={EXPERIENCE_FIELDS}
            onChange={set('experience')}
            addLabel="Add experience"
          />

          <EntryList
            label="Certifications"
            entries={form.certifications}
            fields={CERTIFICATION_FIELDS}
            onChange={set('certifications')}
            addLabel="Add certification"
          />

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
