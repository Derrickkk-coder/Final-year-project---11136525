import React, { useState } from 'react'
import Avatar from './Avatar.jsx'
import StatusPill from './StatusPill.jsx'
import AiIcon from './AiIcon.jsx'
import { toDownloadUrl } from '../api/cloudinary.js'
import interviewFormat from '../utils/interviewFormat.js'

// Medals for the top three, plain rank after that. Only applied to candidates
// that could actually be scored — an unranked candidate has no position.
const MEDALS = ['🥇', '🥈', '🥉']

function tone(score) {
  if (score >= 80) return 'is-strong'
  if (score >= 50) return 'is-moderate'
  return 'is-weak'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatWhen(date) {
  return new Date(date).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}


const STATUS_OPTIONS = ['pending', 'review', 'shortlisted', 'accepted', 'rejected']

export default function CandidateCard({
  application,
  rank,
  busy,
  onStatusChange,
  onShortlist,
  onScheduleInterview,
  onAnalyze,
  analyzing,
}) {
  const [expanded, setExpanded] = useState(false)
  const c = application.applicant || {}
  const ranked = application.matchScore !== null

  return (
    <article className={`cand ${ranked ? tone(application.matchScore) : 'is-unranked'}`}>
      <header className="cand__head">
        <div className="cand__rank" aria-hidden="true">
          {ranked ? (MEDALS[rank] || `#${rank + 1}`) : '—'}
        </div>

        <Avatar src={c.profilePictureUrl} name={c.name} size={44} />

        <div className="cand__ident">
          <h3 className="cand__name">{c.name || 'Unknown applicant'}</h3>
          <p className="cand__meta">
            {c.location ? `${c.location} · ` : ''}Applied {formatDate(application.createdAt)}
          </p>
        </div>

        <div className="cand__score">
          {ranked ? (
            <>
              <span className="cand__score-num">{application.matchScore}%</span>
              <span className="cand__score-label">match</span>
            </>
          ) : (
            <span className="cand__score-none">Not ranked</span>
          )}
        </div>
      </header>

      {/* Why this score — matched first, then the gaps */}
      {ranked ? (
        <div className="cand__skills">
          {application.requiredCount && (
            <p className="cand__skills-summary">
              Matches <strong>{application.matchedCount} of {application.requiredCount}</strong> required skills
              {application.matchInferred && ' (estimated from the job text)'}
            </p>
          )}
          <div className="cand__chips">
            {application.matchedSkills.map((s) => (
              <span className="match-skill is-have" key={`h-${s}`}><span aria-hidden="true">✓</span> {s}</span>
            ))}
            {application.missingSkills.map((s) => (
              <span className="match-skill is-missing" key={`m-${s}`}><span aria-hidden="true">⚠</span> {s}</span>
            ))}
          </div>
        </div>
      ) : (
        <p className="cand__unranked-note">
          {application.unrankedReason === 'no-skills'
            ? "This candidate hasn't listed any skills on their profile, so they can't be scored. Their CV is still worth a look."
            : 'None of their listed skills overlap with this role.'}
        </p>
      )}

      {application.interview && (
        <div className="cand__interview">
          <strong>Interview {formatWhen(application.interview.scheduledAt)}</strong>
          <span> · {interviewFormat(application.interview)}</span>
          {application.interview.details && <span> · {application.interview.details}</span>}
        </div>
      )}

      <footer className="cand__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide candidate' : 'View candidate'}
        </button>

        {application.status !== 'shortlisted' && application.status !== 'accepted' && (
          <button
            type="button"
            className="btn btn--outline-teal btn--sm"
            disabled={busy}
            onClick={onShortlist}
          >
            Shortlist
          </button>
        )}

        <a href={`mailto:${application.contactEmail || c.email}`} className="btn btn--ghost btn--sm">
          Contact
        </a>

        <button type="button" className="btn btn--coral btn--sm" disabled={busy} onClick={onScheduleInterview}>
          {application.interview ? 'Reschedule' : 'Schedule interview'}
        </button>

        <StatusPill status={application.status} />

        <select
          className="cand__status-select"
          value={application.status}
          disabled={busy}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label={`Change status for ${c.name}`}
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </footer>

      {expanded && (
        <div className="cand__detail">
          <div className="cand__detail-grid">
            <div>
              <span className="cand__detail-label">Email</span>
              <a href={`mailto:${application.contactEmail || c.email}`}>{application.contactEmail || c.email}</a>
            </div>
            <div>
              <span className="cand__detail-label">Phone</span>
              {application.phone || c.phone
                ? <a href={`tel:${application.phone || c.phone}`}>{application.phone || c.phone}</a>
                : <span>—</span>}
            </div>
            <div>
              <span className="cand__detail-label">CV</span>
              {application.resumeUrl ? (
                <span style={{ display: 'flex', gap: 12 }}>
                  <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">View</a>
                  <a href={toDownloadUrl(application.resumeUrl, `${c.name || 'applicant'}-CV`)}>Download</a>
                </span>
              ) : <span>—</span>}
            </div>
          </div>

          {c.bio && (
            <section className="cand__section">
              <h4>About</h4>
              <p>{c.bio}</p>
            </section>
          )}

          {c.skills?.length > 0 && (
            <section className="cand__section">
              <h4>All listed skills</h4>
              <div className="cand__chips">
                {c.skills.map((s) => <span className="skill-tag" key={s}>{s}</span>)}
              </div>
            </section>
          )}

          {c.experience?.length > 0 && (
            <section className="cand__section">
              <h4>Work experience</h4>
              {c.experience.map((e, i) => (
                <div className="cand__entry" key={e._id || i}>
                  <strong>{e.role || 'Role not given'}</strong>
                  {e.company && <span> · {e.company}</span>}
                  {(e.startYear || e.endYear) && <span className="cand__entry-years"> {e.startYear}–{e.endYear || 'Present'}</span>}
                  {e.summary && <p>{e.summary}</p>}
                </div>
              ))}
            </section>
          )}

          {c.education?.length > 0 && (
            <section className="cand__section">
              <h4>Education</h4>
              {c.education.map((e, i) => (
                <div className="cand__entry" key={e._id || i}>
                  <strong>{e.qualification || 'Qualification not given'}</strong>
                  {e.institution && <span> · {e.institution}</span>}
                  {(e.startYear || e.endYear) && <span className="cand__entry-years"> {e.startYear}–{e.endYear}</span>}
                </div>
              ))}
            </section>
          )}

          {c.certifications?.length > 0 && (
            <section className="cand__section">
              <h4>Certifications</h4>
              {c.certifications.map((e, i) => (
                <div className="cand__entry" key={e._id || i}>
                  <strong>{e.name}</strong>
                  {e.issuer && <span> · {e.issuer}</span>}
                  {e.year && <span className="cand__entry-years"> {e.year}</span>}
                </div>
              ))}
            </section>
          )}

          <section className="cand__section">
            <h4>AI fit assessment</h4>
            {application.aiAnalysis ? (
              <p style={{ whiteSpace: 'pre-line' }}>{application.aiAnalysis}</p>
            ) : (
              <button
                type="button"
                className="btn btn--outline-teal btn--sm"
                disabled={analyzing}
                onClick={onAnalyze}
              >
                {analyzing ? 'Analysing…' : <><AiIcon size={13} /> Analyse their CV</>}
              </button>
            )}
          </section>
        </div>
      )}
    </article>
  )
}
