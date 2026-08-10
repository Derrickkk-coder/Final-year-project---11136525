import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext.jsx'
import { useConfirm } from '../context/ConfirmContext.jsx'
import CandidateCard from '../components/CandidateCard.jsx'
import InterviewDialog from '../components/InterviewDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'
import DashboardShell from '../components/DashboardShell.jsx'
import {
  fetchApplicationsForJob,
  updateApplicationStatus,
  scheduleInterview,
  analyzeApplication,
} from '../api/applications.js'

export default function JobCandidates() {
  const { id } = useParams()
  const toast = useToast()
  const confirm = useConfirm()

  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [rankingBasis, setRankingBasis] = useState('skills')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [busyId, setBusyId] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [interviewFor, setInterviewFor] = useState(null)
  const [savingInterview, setSavingInterview] = useState(false)

  useEffect(() => {
    fetchApplicationsForJob(id)
      .then((data) => {
        setJob(data.job)
        setApplications(data.applications)
        setRankingBasis(data.rankingBasis)
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load candidates for this job.'))
      .finally(() => setLoading(false))
  }, [id])

  const patch = (applicationId, changes) => {
    setApplications((prev) =>
      prev.map((a) => (a._id === applicationId ? { ...a, ...changes } : a))
    )
  }

  const changeStatus = async (application, status) => {
    setBusyId(application._id)
    try {
      const data = await updateApplicationStatus(application._id, status)
      patch(application._id, { status: data.application.status })
      toast.success(
        `${application.applicant?.name || 'Candidate'} moved to "${status}" — they've been notified.`
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update that candidate.')
    } finally {
      setBusyId(null)
    }
  }

  // Shortlisting and interviewing are the same decision a beat apart, so offer
  // the next step instead of making the employer find the button again. Only
  // when they don't already have an interview booked.
  const shortlistThenOffer = async (application) => {
    await changeStatus(application, 'shortlisted')

    if (application.interview) return

    const scheduleNow = await confirm({
      title: `Schedule an interview with ${application.applicant?.name || 'this candidate'}?`,
      body: "They've been shortlisted and notified. You can set up the interview now, or come back to it later.",
      confirmLabel: 'Schedule now',
      cancelLabel: 'Later',
    })

    if (scheduleNow) setInterviewFor(application)
  }

  const handleScheduleInterview = async (payload) => {
    const application = interviewFor
    setSavingInterview(true)
    try {
      const data = await scheduleInterview(application._id, payload)
      // Status may have moved to shortlisted server-side, so take both back
      patch(application._id, {
        interview: data.application.interview,
        status: data.application.status,
      })
      setInterviewFor(null)
      toast.success(`Interview invitation sent to ${application.applicant?.name || 'the candidate'}.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not schedule that interview.')
    } finally {
      setSavingInterview(false)
    }
  }

  const runAnalysis = async (application) => {
    setAnalyzingId(application._id)
    try {
      const data = await analyzeApplication(application._id)
      patch(application._id, { aiAnalysis: data.analysis })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not analyse that CV right now.')
    } finally {
      setAnalyzingId(null)
    }
  }

  // Rank counts only the scored candidates, so the unrankable ones at the bottom
  // don't consume 🥇🥈🥉
  let rankCursor = -1

  return (
    <DashboardShell
      eyebrow="Top candidates"
      title={job?.title || 'Candidates'}
      actions={job && <Link to={`/employer/jobs/${job._id}/edit`} className="btn btn--ghost">Edit posting</Link>}
    >
      {job && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', margin: '-12px 0 var(--space-5)' }}>
          {job.ref} · {applications.length} {applications.length === 1 ? 'applicant' : 'applicants'}
        </p>
      )}

      {/* An untagged role can only be matched by scanning its text, which is
          less precise — and the employer is the one who can fix that. */}
      {!loading && !error && rankingBasis === 'inferred' && (
        <div className="panel" style={{ background: '#FFF3E0', border: '1px solid #F0D9A8', marginBottom: 20 }}>
          <strong style={{ color: '#8A5A0F' }}>This role has no tagged skills.</strong>
          <p style={{ color: '#8A5A0F', fontSize: 'var(--text-base)', margin: '4px 0 0' }}>
            Candidates are being matched against the words in your description, which is rough.{' '}
            <Link to={`/employer/jobs/${id}/edit`} style={{ color: '#8A5A0F', fontWeight: 700 }}>
              Add required skills
            </Link>{' '}
            for accurate ranking.
          </p>
        </div>
      )}

      {loading && <SkeletonRows count={4} height={120} />}

      {!loading && error && (
        <EmptyState icon="⚠️" tone="error" title="Couldn't load candidates" description={error} />
      )}

      {!loading && !error && applications.length === 0 && (
        <EmptyState
          icon="🔔"
          title="No applicants yet"
          description="Once job seekers apply, they'll be ranked here by how well their skills cover this role."
          action={<Link to="/jobs" className="btn btn--ghost">View the public listing</Link>}
        />
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="cand-list">
          {applications.map((application) => {
            if (application.matchScore !== null) rankCursor += 1
            return (
              <CandidateCard
                key={application._id}
                application={application}
                rank={rankCursor}
                busy={busyId === application._id}
                analyzing={analyzingId === application._id}
                onStatusChange={(status) => changeStatus(application, status)}
                onShortlist={() => shortlistThenOffer(application)}
                onScheduleInterview={() => setInterviewFor(application)}
                onAnalyze={() => runAnalysis(application)}
              />
            )
          })}
        </div>
      )}

      {interviewFor && (
        <InterviewDialog
          candidateName={interviewFor.applicant?.name || 'This candidate'}
          existing={interviewFor.interview}
          saving={savingInterview}
          onCancel={() => setInterviewFor(null)}
          onSubmit={handleScheduleInterview}
        />
      )}
    </DashboardShell>
  )
}
