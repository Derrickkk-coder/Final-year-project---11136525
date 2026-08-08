import React, { useState } from 'react'

const MODES = ['Video', 'Phone', 'On-site']
const PLATFORMS = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Other']

// Caption the details field for what it actually is, so a meeting link isn't
// labelled "Location" and an address isn't labelled "Link".
const DETAIL_LABEL = {
  Video: 'Joining link',
  Phone: 'Number you will call',
  'On-site': 'Address',
}

const DETAIL_PLACEHOLDER = {
  Video: 'e.g. https://meet.google.com/abc-defg-hij',
  Phone: 'e.g. 059 208 1217',
  'On-site': 'e.g. 12 Independence Ave, Accra',
}

// Scheduling form. Its own dialog rather than the shared ConfirmProvider,
// because that one answers yes/no and this collects a date, a format and notes.
export default function InterviewDialog({ candidateName, existing, onCancel, onSubmit, saving }) {
  // datetime-local wants "YYYY-MM-DDTHH:mm" in local time; slicing an ISO string
  // would silently shift a stored time by the UTC offset.
  const toLocalInput = (date) => {
    const d = new Date(date)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const [scheduledAt, setScheduledAt] = useState(
    existing?.scheduledAt ? toLocalInput(existing.scheduledAt) : ''
  )
  const [mode, setMode] = useState(existing?.mode || 'Video')
  const [platform, setPlatform] = useState(existing?.platform || 'Google Meet')
  const [details, setDetails] = useState(existing?.details || '')
  const [note, setNote] = useState(existing?.note || '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!scheduledAt) {
      setError('Choose a date and time for the interview.')
      return
    }
    if (new Date(scheduledAt) < new Date()) {
      setError('That date is in the past — pick a future date and time.')
      return
    }

    onSubmit({
      scheduledAt: new Date(scheduledAt).toISOString(),
      mode,
      // Server ignores this unless mode is Video, but don't send it at all for
      // the other formats
      platform: mode === 'Video' ? platform : undefined,
      details,
      note,
    })
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <form
        className="dialog"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-title"
        style={{ width: 'min(520px, 100%)' }}
      >
        <h2 className="dialog__title" id="interview-title">
          {existing ? 'Reschedule interview' : 'Schedule an interview'}
        </h2>
        <p className="dialog__body" style={{ marginBottom: 'var(--space-5)' }}>
          {candidateName} will be emailed the details and see them on their dashboard.
        </p>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="interview-when">Date and time</label>
            <input
              id="interview-when"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="interview-mode">Format</label>
            <select id="interview-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Only for video — a platform on a phone call or an on-site meeting
            would be noise, and the server discards it anyway */}
        {mode === 'Video' && (
          <div className="form-field">
            <label htmlFor="interview-platform">Platform</label>
            <select
              id="interview-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="interview-details">{DETAIL_LABEL[mode]}</label>
          <input
            id="interview-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={DETAIL_PLACEHOLDER[mode]}
          />
        </div>

        <div className="form-field">
          <label htmlFor="interview-note">Anything else they should know</label>
          <textarea
            id="interview-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Bring a copy of your certificates. Ask for Ama at reception."
            style={{ minHeight: 80 }}
          />
        </div>

        {error && <p style={{ color: 'var(--rust)', fontSize: 'var(--text-sm)', margin: '0 0 12px' }}>{error}</p>}

        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn--pine" disabled={saving}>
            {saving ? 'Sending…' : existing ? 'Update invitation' : 'Send invitation'}
          </button>
        </div>
      </form>
    </div>
  )
}
