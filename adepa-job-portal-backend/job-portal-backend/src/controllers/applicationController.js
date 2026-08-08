import Application from '../models/Application.js'
import Job from '../models/Job.js'
import { sendEmail, applicationStatusEmailTemplate } from '../utils/sendEmail.js'
import { analyzeApplicationFit } from '../utils/analyzeApplication.js'
import { notifyUser } from '../utils/notify.js'

// In-app notification copy per status. Deliberately mirrors the wording
// StatusPill renders ("In review", "Not selected", ...) so the notification and
// the badge next to it never describe the same state differently.
const STATUS_NOTIFICATION = {
  pending: (job) =>
    `Your application for ${job.title} at ${job.company} is back to pending review.`,
  review: (job) =>
    `Your application status for ${job.title} has changed to "In review".`,
  accepted: (job) =>
    `Good news — your application for ${job.title} at ${job.company} has been accepted.`,
  rejected: (job) =>
    `Your application for ${job.title} at ${job.company} was not selected this time.`,
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

// @route   GET /api/applications/job/:jobId
// @access  Private (employer who owns the job)
// Returns applicants for one specific job posting.
export async function getApplicationsForJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.jobId)
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' })
    }
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view applicants for jobs you posted.' })
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name email profilePictureUrl')
      .sort({ createdAt: -1 })

    res.json({ success: true, applications })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/applications/:id/status
// @access  Private (employer who owns the related job)
export async function updateApplicationStatus(req, res, next) {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'review', 'accepted', 'rejected']

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