import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { uploadResumeToCloudinary, toDownloadUrl } from '../api/cloudinary.js'
import { updateProfile } from '../api/auth.js'

const MAX_CV_SIZE = 5 * 1024 * 1024 // 5MB

// "My CV" — upload, preview, download, replace.
//
// Saves as soon as a file is chosen rather than waiting for the profile form's
// Save button. Uploading a CV reads as a completed action in itself, and it
// means the same card works on the dashboard later without a surrounding form.
export default function CvCard({ user, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const inputRef = useRef(null)

  const resumeUrl = user?.resumeUrl || ''
  const hasCv = Boolean(resumeUrl)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    setError('')
    setJustSaved(false)
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }
    if (file.size > MAX_CV_SIZE) {
      setError('That file is too large — please keep your CV under 5MB.')
      return
    }

    setUploading(true)
    try {
      const url = await uploadResumeToCloudinary(file)
      const data = await updateProfile({ resumeUrl: url })
      onChange?.(data.user)
      setJustSaved(true)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not upload your CV. Please check your connection and try again.'
      )
    } finally {
      setUploading(false)
      // Reset so picking the same filename again still fires onChange
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="panel cv-card">
      <div className="cv-card__head">
        <div>
          <h2 className="cv-card__title">My CV</h2>
          <p className="cv-card__sub">
            {hasCv
              ? 'Employers can view and download this from your applications.'
              : 'Upload a PDF so you can apply to roles in one click.'}
          </p>
        </div>
        <span className={`cv-card__state ${hasCv ? 'is-present' : ''}`}>
          {hasCv ? 'Uploaded' : 'Not uploaded'}
        </span>
      </div>

      <input
        ref={inputRef}
        id="cv-upload"
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFile}
        hidden
      />

      <div className="cv-card__actions">
        <button
          type="button"
          className={hasCv ? 'btn btn--ghost btn--sm' : 'btn btn--pine btn--sm'}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : hasCv ? 'Replace CV' : 'Upload CV'}
        </button>

        {hasCv && (
          <>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--outline-teal btn--sm"
            >
              Preview CV
            </a>
            <a
              href={toDownloadUrl(resumeUrl, `${user?.name || 'cv'}-CV`)}
              className="btn btn--outline-teal btn--sm"
            >
              Download CV
            </a>
            <Link to="/cv-review" className="btn btn--pine btn--sm">
              Get an AI review
            </Link>
          </>
        )}
      </div>

      {error && <p className="cv-card__msg is-error">{error}</p>}
      {justSaved && !error && <p className="cv-card__msg is-ok">CV saved to your profile.</p>}
    </div>
  )
}
