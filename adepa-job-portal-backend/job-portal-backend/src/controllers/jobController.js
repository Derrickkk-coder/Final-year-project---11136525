import Job from '../models/Job.js'
import Application from '../models/Application.js'

// @route   POST /api/jobs
// @access  Private (employer only)
export async function createJob(req, res, next) {
  try {
    const {
      title, location, type, remote, salary,
      category, description, responsibilities, requirements, closingAt,
    } = req.body

    if (!title || !location || !type || !category || !description || !closingAt) {
      return res.status(400).json({
        success: false,
        message: 'title, location, type, category, description, and closingAt are required.',
      })
    }

    const job = await Job.create({
      title,
      location,
      type,
      remote,
      salary,
      category,
      description,
      responsibilities: responsibilities || [],
      requirements: requirements || [],
      closingAt,
      company: req.user.company || req.user.name,
      postedBy: req.user._id,
    })

    res.status(201).json({ success: true, job })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/jobs
// @access  Public
// Supports query params: q, category, type, location, page, limit
export async function getJobs(req, res, next) {
  try {
    const { q, category, type, location, page = 1, limit = 20 } = req.query

    const filter = { status: 'open' }

    if (q) {
      filter.$text = { $search: q }
    }
    if (category && category !== 'All categories') {
      filter.category = category
    }
    if (type && type !== 'All types') {
      filter.type = type
    }
  if (location && location !== 'All locations') {
  filter.location = { $regex: location, $options: 'i' }
}

    const pageNum = Math.max(parseInt(page, 10) || 1, 1)
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100)
    const skip = (pageNum - 1) * limitNum

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Job.countDocuments(filter),
    ])

    res.json({
      success: true,
      jobs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/jobs/:id
// @access  Public
export async function getJobById(req, res, next) {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' })
    }

    res.json({ success: true, job })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/jobs/mine/list
// @access  Private (employer only)
export async function getMyJobs(req, res, next) {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, jobs })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/jobs/recommended/mine
// @access  Private (seeker only)
// Suggests open jobs in categories the seeker has previously applied to,
// excluding jobs they've already applied for. Falls back to recent open
// jobs for seekers with no application history yet, so the section is
// never empty for new users.
export async function getRecommendedJobs(req, res, next) {
  try {
    const myApplications = await Application.find({ applicant: req.user._id }).populate('job', 'category')

    const appliedJobIds = myApplications.map((a) => a.job?._id).filter(Boolean)
    const categories = [...new Set(myApplications.map((a) => a.job?.category).filter(Boolean))]

    let jobs = []

    if (categories.length > 0) {
      jobs = await Job.find({
        status: 'open',
        category: { $in: categories },
        _id: { $nin: appliedJobIds },
      })
        .sort({ createdAt: -1 })
        .limit(6)
    }

    if (jobs.length === 0) {
      jobs = await Job.find({
        status: 'open',
        _id: { $nin: appliedJobIds },
      })
        .sort({ createdAt: -1 })
        .limit(6)
    }

    res.json({ success: true, jobs })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/jobs/:id
// @access  Private (employer who owns the job)
export async function updateJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' })
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit jobs you posted.' })
    }

    const allowedFields = [
      'title', 'location', 'type', 'remote', 'salary', 'category',
      'description', 'responsibilities', 'requirements', 'closingAt', 'status',
    ]
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) job[field] = req.body[field]
    })

    await job.save()
    res.json({ success: true, job })
  } catch (err) {
    next(err)
  }
}

// @route   DELETE /api/jobs/:id
// @access  Private (employer who owns the job)
export async function deleteJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' })
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete jobs you posted.' })
    }

    await job.deleteOne()
    res.json({ success: true, message: 'Job deleted.' })
  } catch (err) {
    next(err)
  }
}