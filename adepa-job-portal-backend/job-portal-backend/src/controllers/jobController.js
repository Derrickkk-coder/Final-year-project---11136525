import Job from '../models/Job.js'
import Application from '../models/Application.js'
import { notifyManyUsers } from '../utils/notify.js'
import { scoreJobForSkills } from '../utils/matchScore.js'
import { cleanSkills } from '../utils/cleanSkills.js'

// Tells seekers who've applied in this category before that a new role landed.
// Same signal the "Jobs you might like" panel already uses (category of past
// applications), pushed rather than waiting to be pulled.
//
// Fire-and-forget: the employer's response must not wait on a fan-out whose
// size depends on how many people have applied in that category.
async function notifySeekersOfNewJob(job) {
  try {
    const jobsInCategory = await Job.find({
      category: job.category,
      _id: { $ne: job._id },
    }).select('_id')

    if (jobsInCategory.length === 0) return

    // distinct() collapses repeat applicants to one notification each
    const applicantIds = await Application.distinct('applicant', {
      job: { $in: jobsInCategory.map((j) => j._id) },
    })

    if (applicantIds.length === 0) return

    await notifyManyUsers(applicantIds, {
      type: 'new_matching_job',
      message: `A new ${job.category} role matching your profile has been posted: ${job.title} at ${job.company}.`,
      link: `/jobs/${job._id}`,
      job: job._id,
    })
  } catch (err) {
    console.error('[notify] New-job fan-out failed:', err.message)
  }
}

// @route   POST /api/jobs
// @access  Private (employer only)
export async function createJob(req, res, next) {
  try {
    const {
      title, location, type, remote, salary,
      category, description, responsibilities, requirements, skills, closingAt,
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
      skills: cleanSkills(skills),
      closingAt,
      company: req.user.company || req.user.name,
      postedBy: req.user._id,
    })

    notifySeekersOfNewJob(job)

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
// Recommends open jobs the seeker hasn't applied to, ranked three ways in
// descending order of usefulness:
//
//   1. by skill match, when the seeker has listed skills — each job comes back
//      with a matchScore and the skills that matched (see utils/matchScore.js)
//   2. by category of past applications, when there are no skills to match on
//   3. by recency, so a brand new account never sees an empty panel
//
// `basis` tells the client which of the three produced the list, so the UI can
// caption it honestly instead of implying a match score exists when it doesn't.
const RECOMMENDATION_LIMIT = 6

export async function getRecommendedJobs(req, res, next) {
  try {
    const myApplications = await Application.find({ applicant: req.user._id })
      .populate('job', 'category')

    const appliedJobIds = myApplications.map((a) => a.job?._id).filter(Boolean)
    const skills = req.user.skills || []

    // ---- 1. Skill match ----
    if (skills.length > 0) {
      // Scored in application code rather than in the query: the weighting is
      // the interesting part of this feature and belongs somewhere readable and
      // testable, not inside an aggregation pipeline. At this scale the cost of
      // reading the open jobs is negligible.
      const openJobs = await Job.find({
        status: 'open',
        _id: { $nin: appliedJobIds },
      }).lean()

      const scored = openJobs
        .map((job) => {
          const match = scoreJobForSkills(job, skills)
          return match ? { ...job, matchScore: match.score, matchedSkills: match.matchedSkills } : null
        })
        .filter(Boolean)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, RECOMMENDATION_LIMIT)

      if (scored.length > 0) {
        return res.json({ success: true, jobs: scored, basis: 'skills' })
      }
      // No job matched a single skill — fall through to the weaker signals
      // rather than showing nothing.
    }

    // ---- 2. Category of past applications ----
    const categories = [...new Set(myApplications.map((a) => a.job?.category).filter(Boolean))]

    if (categories.length > 0) {
      const byCategory = await Job.find({
        status: 'open',
        category: { $in: categories },
        _id: { $nin: appliedJobIds },
      })
        .sort({ createdAt: -1 })
        .limit(RECOMMENDATION_LIMIT)

      if (byCategory.length > 0) {
        return res.json({ success: true, jobs: byCategory, basis: 'category' })
      }
    }

    // ---- 3. Most recent open roles ----
    const recent = await Job.find({
      status: 'open',
      _id: { $nin: appliedJobIds },
    })
      .sort({ createdAt: -1 })
      .limit(RECOMMENDATION_LIMIT)

    res.json({ success: true, jobs: recent, basis: 'recent' })
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
      'description', 'responsibilities', 'requirements', 'skills', 'closingAt', 'status',
    ]
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) job[field] = req.body[field]
    })

    // Normalised the same way as on create, so an edit can't reintroduce
    // untrimmed or duplicated tags
    if (req.body.skills !== undefined) job.skills = cleanSkills(req.body.skills)

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