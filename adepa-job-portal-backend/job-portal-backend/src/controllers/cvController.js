import User from '../models/User.js'
import Job from '../models/Job.js'
import { analyzeCvDocument } from '../utils/analyzeCv.js'

// @route   GET /api/cv/analysis
// @access  Private (seeker only)
// Returns the cached review without spending an API call, so opening the page
// doesn't bill anything. `stale` tells the client the stored review belongs to a
// CV the user has since replaced.
export async function getMyCvAnalysis(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+cvAnalysis')

    if (!user.resumeUrl) {
      return res.json({ success: true, analysis: null, hasCv: false })
    }

    const analysis = user.cvAnalysis || null

    res.json({
      success: true,
      hasCv: true,
      analysis,
      stale: Boolean(analysis && analysis.analyzedResumeUrl !== user.resumeUrl),
    })
  } catch (err) {
    next(err)
  }
}

// @route   POST /api/cv/analyze
// @access  Private (seeker only)
// Body: { jobId?, force? }
//
// Without jobId this is a general review, cached against the CV it was produced
// from. With jobId it also compares the CV to that specific role — deliberately
// not cached, since it's an explicit action against a chosen job and caching it
// would mean a document per (user, job) pair for little benefit.
export async function analyzeMyCv(req, res, next) {
  try {
    const { jobId, force } = req.body

    const user = await User.findById(req.user._id).select('+cvAnalysis')

    if (!user.resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Upload your CV first — there is nothing to analyse yet.',
      })
    }

    let job = null
    if (jobId) {
      job = await Job.findById(jobId).lean()
      if (!job) {
        return res.status(404).json({ success: false, message: 'That job could not be found.' })
      }
    }

    // Serve the cache only for the general review, only when not forced, and
    // only when it was produced from the CV currently on file.
    if (!job && !force && user.cvAnalysis?.analyzedResumeUrl === user.resumeUrl) {
      return res.json({ success: true, analysis: user.cvAnalysis, cached: true })
    }

    const analysis = await analyzeCvDocument({
      resumeUrl: user.resumeUrl,
      job,
      seekerSkills: user.skills || [],
    })

    // Only the general review is worth storing; a job comparison is about one
    // posting and would be misleading to show back as "your CV review".
    if (!job) {
      user.cvAnalysis = {
        ...analysis,
        analyzedResumeUrl: user.resumeUrl,
        analyzedAt: new Date(),
      }
      await user.save()
    }

    res.json({ success: true, analysis, cached: false })
  } catch (err) {
    // Same shape as the employer-side analyzer: a 502 with a readable message,
    // since the failure is almost always upstream (Gemini, or fetching the PDF
    // from Cloudinary) rather than a bug in the request.
    console.error('[ai] CV analysis failed:', err.message)
    res.status(502).json({
      success: false,
      message: 'Could not analyse your CV right now. Please try again in a moment.',
    })
  }
}
