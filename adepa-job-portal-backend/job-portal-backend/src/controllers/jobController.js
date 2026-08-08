import Job from '../models/Job.js'
import Application from '../models/Application.js'
import { notifyManyUsers } from '../utils/notify.js'
import { withMatch } from '../utils/matchScore.js'
import { cleanSkills } from '../utils/cleanSkills.js'
import {
  studentFriendlyQuery,
  isStudentFriendly,
  fieldMatchesCategory,
} from '../utils/studentFriendly.js'

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
      title, location, type, remote, salary, experienceLevel,
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
      // Empty string would fail the enum, so send nothing when unclassified
      experienceLevel: experienceLevel || undefined,
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
    const { q, category, type, location, studentFriendly, page = 1, limit = 20 } = req.query

    const filter = { status: 'open' }

    if (q) {
      filter.$text = { $search: q }
    }
    // Powers the public "Opportunities for students & graduates" feed and the
    // jobs-board toggle. Nested under $and because studentFriendlyQuery is
    // itself an $or, and a second bare $or on the filter would overwrite it.
    if (studentFriendly === 'true') {
      filter.$and = [studentFriendlyQuery]
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
// @access  Public (personalised for a signed-in seeker via optionalAuth)
//
// A seeker with skills on their profile gets the match attached, so the job page
// can show why the role fits at the moment they're deciding whether to apply.
// Anonymous callers, employers, and seekers with no skills listed get the plain
// job — the match fields are simply absent and the UI omits that section.
export async function getJobById(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).lean()

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' })
    }

    const skills = req.user?.role === 'seeker' ? req.user.skills : null

    res.json({
      success: true,
      job: (skills?.length ? withMatch(job, skills) : null) || job,
    })
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
    const student = req.user.student
    const isStudent = Boolean(student?.isStudent)

    // Students get internships, national service and entry-level roles lifted
    // above everything else, then ordered by match within each group. A partition
    // rather than a score bonus: a bonus would be an invented number competing
    // with the real coverage figure the UI displays, and "why is this 92% below
    // that 84%?" is a question the interface couldn't then answer.
    const studentFirst = (a, b) => {
      if (!isStudent) return 0
      const aFriendly = isStudentFriendly(a)
      const bFriendly = isStudentFriendly(b)
      if (aFriendly !== bFriendly) return aFriendly ? -1 : 1
      // Within a group, a role in their field of study edges ahead
      const aField = fieldMatchesCategory(student.fieldOfStudy, a.category)
      const bField = fieldMatchesCategory(student.fieldOfStudy, b.category)
      if (aField !== bField) return aField ? -1 : 1
      return 0
    }

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
        .map((job) => withMatch(job, skills))
        .filter(Boolean)
        // Student-friendly first (for students), then by match. Ties break on
        // how many skills actually matched, so an 8-of-9 role ranks above a
        // 4-of-5 at the same percentage — see the note in matchScore.js about
        // small denominators.
        .sort(
          (a, b) =>
            studentFirst(a, b) || b.matchScore - a.matchScore || b.matchedCount - a.matchedCount
        )
        .slice(0, RECOMMENDATION_LIMIT)

      if (scored.length > 0) {
        return res.json({ success: true, jobs: scored, basis: 'skills', studentMode: isStudent })
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
        .limit(RECOMMENDATION_LIMIT * 2)
        .lean()

      if (byCategory.length > 0) {
        return res.json({
          success: true,
          jobs: byCategory.sort(studentFirst).slice(0, RECOMMENDATION_LIMIT),
          basis: 'category',
          studentMode: isStudent,
        })
      }
    }

    // ---- 3. Recent open roles ----
    // A student with no skills and no history gets the student feed rather than
    // whatever happens to be newest — the most useful thing we can offer when
    // there's nothing personal to match on yet.
    if (isStudent) {
      const studentRecent = await Job.find({
        status: 'open',
        _id: { $nin: appliedJobIds },
        ...studentFriendlyQuery,
      })
        .sort({ createdAt: -1 })
        .limit(RECOMMENDATION_LIMIT)
        .lean()

      if (studentRecent.length > 0) {
        return res.json({
          success: true,
          jobs: studentRecent,
          basis: 'student',
          studentMode: true,
        })
      }
    }

    const recent = await Job.find({
      status: 'open',
      _id: { $nin: appliedJobIds },
    })
      .sort({ createdAt: -1 })
      .limit(RECOMMENDATION_LIMIT)
      .lean()

    res.json({
      success: true,
      jobs: recent.sort(studentFirst),
      basis: 'recent',
      studentMode: isStudent,
    })
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

    // Separate because clearing it needs undefined, not the '' the form sends
    if (req.body.experienceLevel !== undefined) {
      job.experienceLevel = req.body.experienceLevel || undefined
    }

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