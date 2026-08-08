import React, { useState } from 'react'
import { submitTestimonial } from '../api/testimonials.js'

const MIN_QUOTE = 20
const MAX_QUOTE = 400

// Public comment form for the landing page — no account needed, which is the
// point. Collapsed behind a button so it doesn't compete with the testimonials
// it sits under.
export default function TestimonialForm() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    authorType: 'seeker',
    role: '',
    company: '',
    quote: '',
    rating: 5,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Please add your name.')
      return
    }
    if (form.quote.trim().length < MIN_QUOTE) {
      setError(`Please write at least ${MIN_QUOTE} characters so your comment is useful to others.`)
      return
    }

    setSubmitting(true)
    try {
      const data = await submitTestimonial({ ...form, rating: Number(form.rating) })
      setDone(data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send your comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      // role="status" so the confirmation is announced — the form it replaces
      // has just vanished, and a screen reader user needs to know why
      <div className="comment-box comment-box--done" role="status">
        <span className="comment-box__tick" aria-hidden="true">✓</span>
        <div>
          <strong className="comment-box__thanks">Thank you!</strong>
          <p>{done}</p>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setDone('')
              setOpen(false)
              setForm({ name: '', authorType: 'seeker', role: '', company: '', quote: '', rating: 5 })
            }}
          >
            Leave another
          </button>
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="comment-box comment-box--prompt">
        <div>
          <strong>Used NextLeap?</strong>
          <p>
            Tell others how it went — as a job seeker or an employer. No account needed.
          </p>
        </div>
        <button type="button" className="btn btn--outline-teal" onClick={() => setOpen(true)}>
          Leave a comment
        </button>
      </div>
    )
  }

  return (
    <form className="comment-box" onSubmit={handleSubmit}>
      <h3 className="comment-box__title">Leave a comment</h3>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="c-name">Your name</label>
          <input id="c-name" value={form.name} onChange={update('name')} placeholder="e.g. Ama Serwaa" maxLength={60} />
        </div>
        <div className="form-field">
          <label htmlFor="c-type">I'm a…</label>
          <select id="c-type" value={form.authorType} onChange={update('authorType')}>
            <option value="seeker">Job seeker</option>
            <option value="employer">Employer</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="c-role">
            {form.authorType === 'employer' ? 'Your role' : 'Role you applied for'}
            <span className="comment-box__optional"> — optional</span>
          </label>
          <input
            id="c-role"
            value={form.role}
            onChange={update('role')}
            maxLength={80}
            placeholder={form.authorType === 'employer' ? 'e.g. HR Lead' : 'e.g. Frontend Engineer'}
          />
        </div>
        <div className="form-field">
          <label htmlFor="c-company">
            Company<span className="comment-box__optional"> — optional</span>
          </label>
          <input id="c-company" value={form.company} onChange={update('company')} maxLength={80} placeholder="e.g. Zaya Health" />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="c-rating">Rating</label>
        <select id="c-rating" value={form.rating} onChange={update('rating')}>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{'★'.repeat(r)} ({r}/5)</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="c-quote">Your comment</label>
        <textarea
          id="c-quote"
          value={form.quote}
          onChange={update('quote')}
          maxLength={MAX_QUOTE}
          placeholder="What was using NextLeap like?"
          style={{ minHeight: 96 }}
        />
        <span className="hint">{form.quote.length}/{MAX_QUOTE} characters</span>
      </div>

      {error && <p style={{ color: 'var(--rust)', fontSize: 'var(--text-sm)', margin: '0 0 12px' }}>{error}</p>}

      <div className="comment-box__actions">
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn--pine" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send comment'}
        </button>
      </div>

      <p className="comment-box__note">
        Comments are checked before they appear on the site.
      </p>
    </form>
  )
}
