import User from '../models/User.js'
import Job from '../models/Job.js'
import Application from '../models/Application.js'

// The homepage is the most-requested page on the site and these four numbers
// barely move minute to minute, so they're cached briefly rather than costing
// four counts per visitor. In-process only — fine for a single instance, and
// nothing here is sensitive enough to worry about staleness.
const CACHE_TTL_MS = 60 * 1000
let cache = { at: 0, data: null }

// @route   GET /api/stats
// @access  Public
//
// Aggregate counts for the landing page. Deliberately counts what the words
// actually claim:
//   - employers counts *approved* employers, since a pending account can't post
//     and shouldn't be presented as one of the platform's employers
//   - seekers and employers exclude deactivated accounts
//   - successfulApplications counts accepted applications — a real outcome,
//     not applications sent
export async function getPublicStats(req, res, next) {
  try {
    if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) {
      return res.json({ success: true, stats: cache.data, cached: true })
    }

    const [openJobs, seekers, employers, successfulApplications] = await Promise.all([
      Job.countDocuments({ status: 'open' }),
      User.countDocuments({ role: 'seeker', isActive: true }),
      User.countDocuments({ role: 'employer', employerStatus: 'approved', isActive: true }),
      Application.countDocuments({ status: 'accepted' }),
    ])

    const stats = { openJobs, seekers, employers, successfulApplications }
    cache = { at: Date.now(), data: stats }

    res.json({ success: true, stats, cached: false })
  } catch (err) {
    next(err)
  }
}
