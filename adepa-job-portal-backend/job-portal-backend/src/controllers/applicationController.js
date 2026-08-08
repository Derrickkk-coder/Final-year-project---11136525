import Application from '../models/Application.js'
import Job from '../models/Job.js'
import {
  sendEmail,
  applicationStatusEmailTemplate,
  interviewEmailTemplate,
  formatInterviewWhen,
} from '../utils/sendEmail.js'
import { analyzeApplicationFit } from '../utils/analyzeApplication.js'
import { notifyUser } from '../utils/notify.js'
import { withCandidateMatch } from '../utils/matchScore.js'

// In-app notification copy per status. Deliberately mirrors the wording
// StatusPill renders ("In review", "Not selected", ...) so the notification and
// the badge next to it never describe the same state differently.
const STATUS_NOTIFICATION = {
  pending: (job) =>
    `Your application for ${job.title} at ${job.company} is back to pending review.`,
  review: (job) =>
    `Your application status for ${job.title} has changed to "In review".`,
  shortlisted: (job) =>
    `You've been shortlisted for ${job.title} at ${job.company}.`,
  accepted: (job) =>
    `Good news — your application for ${job.title} at ${job.company} has been accepted.`,
  rejected: (job) =>
    `Your application for ${job.title} at ${job.company} was not selected this time.`,
}

// Fire-and-forget, same as the status-change mail
async function notifyApplicantOfInterview(application) {
  try {
    await sendEmail({
      to: application.applicant.email,
      subject: `Interview invitation — ${application.job.title}`,
      html: interviewEmailTemplate({
        name: application.applicant.name,
        jobTitle: application.job.title,
        company: application.job.company,
        interview: application.interview,
      }),
    })
    console.log(`[email] Interview invitation SENT to ${application.applicant.email}`)
  } catch (err) {
    console.error('[email] FAILED to send interview invitation:', err.message)
  }
}

// Fire-and-forget, same pattern as verification emails — a slow/failed email
// should never block or break the status update itself.
async function notifyApplicantOfStatusChange(application) {
  try {
    await sendEmail({
      to: application.applicant.email,
      subject: `Update on your application — ${application.job.title}`,
      html: applicationStatusEmailTemplate({
        name: application.applicant.name,
        jobTitle: application.job.title,
        company: application.job.company,
        status: application.status,
      }),
    })
    console.log(`[email] Status update email SENT to ${application.applicant.email}`)
  } catch (err) {
    console.error(`[email] FAILED to send status update email:`, err.message)
  }
}

// @route   POST /api/applications
// @access  Private (seeker only)
export async function applyToJob(req, res, next) {
  try {
    const { jobId, resumeUrl, phone, contactEmail } = req.body

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required.' })
    }
    if (!resumeUrl) {
      return res.status(400).json({ success: false, message: 'A resume is required to apply.' })
    }
    if (!phone) {
      return res.status(400).json({ success: false, message: 'A phone number is required to apply.' })
    }
    if (!contactEmail) {
      return res.status(400).json({ success: false, message: 'A contact email is required to apply.' })
    }

    const job = await Job.findById(jobId)
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' })
    }

    if (job.status === 'closed') {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting applications.' })
    }

    const existing = await Application.findOne({ job: jobId, applicant: req.user._id })
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied to this job.' })
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      resumeUrl,
      phone,
      contactEmail,
    })

    // Keep the denormalised counter on Job in sync
    job.applicantsCount += 1
    await job.save()

    // Save this resume and phone number to the seeker's profile so they're
    // reused automatically as defaults for future applications.
    let profileChanged = false
    if (req.user.resumeUrl !== resumeUrl) {
      req.user.resumeUrl = resumeUrl
      profileChanged = true
    }
    if (req.user.phone !== phone) {
      req.user.phone = phone
      profileChanged = true
    }
    if (profileChanged) {
      await req.user.save()
    }

    res.status(201).json({ success: true, application })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/applications/mine
// @access  Private (seeker only)
export async function getMyApplications(req, res, next) {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title company ref status closingAt')
      .sort({ createdAt: -1 })

    res.json({ success: true, applications })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/applications/employer
// @access  Private (employer only)
// Returns every application submitted to any job this employer has posted.
export async function getApplicationsForEmployer(req, res, next) {
  try {
    const myJobs = await Job.find({ postedBy: req.user._id }).select('_id')
    const jobIds = myJobs.map((j) => j._id)

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title company ref')
      .populate('applicant', 'name email profilePictureUrl')
      .sort({ createdAt: -1 })

    res.json({ success: true, applications })
  } catch (err) {
    next(err)
  }
}

// The candidate's profile, as an employer they applied to is allowed to see it.
// Listed explicitly rather than returning the whole user document, so adding a
// private field to the User schema later can't leak it here by default.
const CANDIDATE_FIELDS =
  'name email phone profilePictureUrl location bio skills education experience certifications resumeUrl'

// @route   GET /api/applications/job/:jobId
// @access  Private (employer who owns the job)
//
// Applicants for one posting, ranked by how well their profile skills cover the
// role's requirements — the seeker-side match read from the employer's side.
//
// Candidates who can't be scored (no skills listed, or no overlap) are still
// returned, always after the ranked ones, with matchScore null. An employer
// needs to see every applicant; silently hiding the unrankable would make the
// list look wrong and the feature untrustworthy.
export async function getApplicationsForJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.jobId).lean()
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' })
    }
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view applicants for jobs you posted.' })
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', CANDIDATE_FIELDS)
      .sort({ createdAt: -1 })
      .lean()

    const ranked = applications
      .map((app) => withCandidateMatch(app, job, app.applicant?.skills))
      .sort((a, b) => {
        // Unrankable candidates sink to the bottom rather than being treated as 0%
        if (a.matchScore === null && b.matchScore === null) return 0
        if (a.matchScore === null) return 1
        if (b.matchScore === null) return -1
        // Same tie-break as the seeker side: more matched skills wins
        return b.matchScore - a.matchScore || b.matchedCount - a.matchedCount
      })

    res.json({
      success: true,
      job: {
        _id: job._id,
        title: job.title,
        company: job.company,
        ref: job.ref,
        status: job.status,
        skills: job.skills || [],
        applicantsCount: job.applicantsCount || 0,
      },
      applications: ranked,
      // Untagged roles fall back to scanning the posting's text, which is less
      // precise. Tell the employer, since they're the one who can fix it.
      rankingBasis: (job.skills || []).length > 0 ? 'skills' : 'inferred',
    })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/applications/interviews
// @access  Private (seeker or employer)
//
// Every scheduled interview the caller is party to. One endpoint for both sides
// because it's the same question asked from two positions — an employer's
// interviews are the ones on their postings, a seeker's are their own — and the
// calendar rendering it is identical either way.
export async function getMyInterviews(req, res, next) {
  try {
    let filter

    if (req.user.role === 'employer') {
      const myJobs = await Job.find({ postedBy: req.user._id }).select('_id')
      filter = { job: { $in: myJobs.map((j) => j._id) } }
    } else {
      filter = { applicant: req.user._id }
    }

    const interviews = await Application.find({
      ...filter,
      interview: { $exists: true, $ne: null },
    })
      .populate('job', 'title company ref')
      .populate('applicant', 'name email phone profilePictureUrl')
      .sort({ 'interview.scheduledAt': 1 })
      .lean()

    // Orphaned applications (job deleted) would render as a blank calendar entry
    res.json({ success: true, interviews: interviews.filter((a) => a.job) })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/applications/:id/interview
// @access  Private (employer who owns the related job)
// Body: { scheduledAt, mode, details, note }
export async function scheduleInterview(req, res, next) {
  try {
    const { scheduledAt, mode, platform, details, note } = req.body

    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: 'An interview date and time is required.' })
    }

    const when = new Date(scheduledAt)
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ success: false, message: 'That interview date could not be understood.' })
    }

    const application = await Application.findById(req.params.id)
      .populate('job', 'postedBy title company')
      .populate('applicant', 'name email')

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' })
    }
    if (!application.job) {
      return res.status(404).json({
        success: false,
        message: 'The job for this application no longer exists.',
      })
    }
    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only schedule interviews for jobs you posted.',
      })
    }

    const resolvedMode = ['On-site', 'Phone', 'Video'].includes(mode) ? mode : 'Video'
    const PLATFORMS = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Other']

    application.interview = {
      scheduledAt: when,
      mode: resolvedMode,
      // Only stored for video interviews — a platform on a phone call or an
      // on-site meeting would be meaningless and would show up in the email
      platform: resolvedMode === 'Video' && PLATFORMS.includes(platform) ? platform : undefined,
      details: details || '',
      note: note || '',
      setAt: new Date(),
    }

    // Scheduling an interview implies the candidate is shortlisted, so move them
    // there rather than leaving the status contradicting the invitation.
    if (['pending', 'review'].includes(application.status)) {
      application.status = 'shortlisted'
    }

    await application.save()

    // Both fire-and-forget, as elsewhere
    notifyApplicantOfInterview(application)
    notifyUser({
      recipient: application.applicant._id,
      type: 'interview_scheduled',
      // The date belongs in the message itself. A notification that only says
      // an interview exists forces the reader to open the dashboard to learn
      // the one thing they actually need — when it is.
      message: `Interview for ${application.job.title} at ${application.job.company} — ${formatInterviewWhen(when)}.`,
      link: '/dashboard',
      job: application.job._id,
      application: application._id,
    })

    res.json({ success: true, application })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/applications/:id/status
// @access  Private (employer who owns the related job)
export async function updateApplicationStatus(req, res, next) {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'review', 'shortlisted', 'accepted', 'rejected']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(', ')}`,
      })
    }

    const application = await Application.findById(req.params.id)
      .populate('job', 'postedBy title company')
      .populate('applicant', 'name email')
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' })
    }

    // Deleting a job doesn't cascade to its applications, so `job` can populate
    // as null on an orphaned record. Without this guard every line below that
    // touches application.job throws a TypeError and the caller gets a 500
    // instead of an explanation.
    if (!application.job) {
      return res.status(404).json({
        success: false,
        message: 'The job for this application no longer exists.',
      })
    }

    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update applications for jobs you posted.',
      })
    }

    application.status = status
    await application.save()

    // Both fire-and-forget — neither delays nor affects this response.
    notifyApplicantOfStatusChange(application)

    const buildMessage = STATUS_NOTIFICATION[status]
    if (buildMessage) {
      notifyUser({
        recipient: application.applicant._id,
        type: 'application_status',
        message: buildMessage(application.job),
        link: '/dashboard',
        job: application.job._id,
        application: application._id,
      })
    }

    res.json({ success: true, application })
  } catch (err) {
    next(err)
  }
}
// @route   POST /api/applications/:id/analyze
// @access  Private (employer who owns the related job)
// Generates (or regenerates, on request) an AI fit assessment comparing the
// applicant's resume against the job posting. Cached on the Application so
// re-viewing it doesn't trigger a fresh paid API call every time.
export async function analyzeApplication(req, res, next) {
  try {
    const { force } = req.body

    const application = await Application.findById(req.params.id).populate('job')
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' })
    }

    // Same orphaned-job guard as updateApplicationStatus above
    if (!application.job) {
      return res.status(404).json({
        success: false,
        message: 'The job for this application no longer exists.',
      })
    }

    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only analyze applications for jobs you posted.',
      })
    }

    // Return the cached result unless the employer explicitly asked for a
    // fresh one — avoids re-billing the API on every page view.
    if (application.aiAnalysis && !force) {
      return res.json({ success: true, analysis: application.aiAnalysis, cached: true })
    }

    const analysis = await analyzeApplicationFit({
      job: application.job,
      resumeUrl: application.resumeUrl,
    })

    application.aiAnalysis = analysis
    application.aiAnalyzedAt = new Date()
    await application.save()

    res.json({ success: true, analysis, cached: false })
  } catch (err) {
    console.error('[ai] Analysis failed:', err.message)
    res.status(502).json({
      success: false,
      message: 'Could not generate an analysis right now. Please try again in a moment.',
    })
  }
}