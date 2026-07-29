import User from '../models/User.js'
import Job from '../models/Job.js'
import Application from '../models/Application.js'

// @route   GET /api/admin/employers?status=pending
// @access  Private (admin only)
// Lists employer accounts, optionally filtered by employerStatus.
export async function getEmployers(req, res, next) {
  try {
    const { status } = req.query
    const filter = { role: 'employer' }

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.employerStatus = status
    }

    const employers = await User.find(filter).sort({ createdAt: -1 })

    res.json({ success: true, employers })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/admin/employers/:id/approve
// @access  Private (admin only)
export async function approveEmployer(req, res, next) {
  try {
    const employer = await User.findById(req.params.id)

    if (!employer || employer.role !== 'employer') {
      return res.status(404).json({ success: false, message: 'Employer account not found.' })
    }

    employer.employerStatus = 'approved'
    await employer.save()

    res.json({ success: true, employer })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/admin/employers/:id/reject
// @access  Private (admin only)
export async function rejectEmployer(req, res, next) {
  try {
    const employer = await User.findById(req.params.id)

    if (!employer || employer.role !== 'employer') {
      return res.status(404).json({ success: false, message: 'Employer account not found.' })
    }

    employer.employerStatus = 'rejected'
    await employer.save()

    res.json({ success: true, employer })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/admin/users?role=seeker|employer
// @access  Private (admin only)
// Lists all users, optionally filtered by role. Excludes other admin
// accounts from the list, since admin accounts aren't self-service —
// there's no scenario where one admin should deactivate another from this UI.
export async function getAllUsers(req, res, next) {
  try {
    const { role } = req.query
    const filter = { role: { $ne: 'admin' } }

    if (role && ['seeker', 'employer'].includes(role)) {
      filter.role = role
    }

    const users = await User.find(filter).sort({ createdAt: -1 })

    res.json({ success: true, users })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/admin/users/:id/status
// @access  Private (admin only)
// Generic activate/deactivate toggle, usable for any non-admin account.
export async function setUserActiveStatus(req, res, next) {
  try {
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be true or false.' })
    }

    const targetUser = await User.findById(req.params.id)
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    if (targetUser.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deactivated from this panel.' })
    }

    targetUser.isActive = isActive
    await targetUser.save()

    res.json({ success: true, user: targetUser })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/admin/jobs
// @access  Private (admin only)
// Lists every job on the platform, regardless of status — unlike the public
// GET /api/jobs endpoint, which only shows open jobs.
export async function getAllJobsAdmin(req, res, next) {
  try {
    const jobs = await Job.find()
      .populate('postedBy', 'name email company')
      .sort({ createdAt: -1 })

    res.json({ success: true, jobs })
  } catch (err) {
    next(err)
  }
}

// @route   DELETE /api/admin/jobs/:id
// @access  Private (admin only)
// Admin override — unlike the employer's own DELETE /api/jobs/:id, this
// isn't restricted to jobs the requester posted themselves.
export async function deleteJobAdmin(req, res, next) {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' })
    }

    await job.deleteOne()

    res.json({ success: true, message: 'Job removed.' })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/admin/stats
// @access  Private (admin only)
// Simple platform-wide overview numbers for the admin dashboard.
export async function getStats(req, res, next) {
  try {
    const [
      totalSeekers,
      totalEmployers,
      pendingEmployers,
      totalJobs,
      openJobs,
      totalApplications,
    ] = await Promise.all([
      User.countDocuments({ role: 'seeker' }),
      User.countDocuments({ role: 'employer' }),
      User.countDocuments({ role: 'employer', employerStatus: 'pending' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Application.countDocuments(),
    ])

    res.json({
      success: true,
      stats: {
        totalSeekers,
        totalEmployers,
        pendingEmployers,
        totalJobs,
        openJobs,
        totalApplications,
      },
    })
  } catch (err) {
    next(err)
  }
}