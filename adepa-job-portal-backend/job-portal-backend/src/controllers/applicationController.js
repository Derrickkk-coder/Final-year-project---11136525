import Application from '../models/Application.js'
import Job from '../models/Job.js'

// @route   POST /api/applications
// @access  Private (seeker only)
export async function applyToJob(req, res, next) {
  try {
    const { jobId, resumeUrl } = req.body

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required.' })
    }
    if (!resumeUrl) {
      return res.status(400).json({ success: false, message: 'A resume is required to apply.' })
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
    })

    job.applicantsCount += 1
    await job.save()

    if (req.user.resumeUrl !== resumeUrl) {
      req.user.resumeUrl = resumeUrl
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
export async function getApplicationsForEmployer(req, res, next) {
  try {
    const myJobs = await Job.find({ postedBy: req.user._id }).select('_id')
    const jobIds = myJobs.map((j) => j._id)

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title company ref')
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, applications })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/applications/job/:jobId
// @access  Private (employer who owns the job)
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
      .populate('applicant', 'name email')
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

    const application = await Application.findById(req.params.id).populate('job', 'postedBy')
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' })
    }

    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update applications for jobs you posted.',
      })
    }

    application.status = status
    await application.save()

    res.json({ success: true, application })
  } catch (err) {
    next(err)
  }
}