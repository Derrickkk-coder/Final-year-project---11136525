import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Verifies the Bearer token on the request, attaches the user (minus password)
// to req.user, and calls next(). Use on any route that requires login.
export async function protect(req, res, next) {
  let token

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized — user no longer exists' })
    }

    // Re-check on every request, not just at login — this way, an admin
    // deactivating someone takes effect immediately, even if that person is
    // already holding a valid, unexpired token from before the deactivation.
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        accountDeactivated: true,
        message: 'This account has been deactivated.',
      })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized — invalid or expired token' })
  }
}

// Requires an employer account to have been approved by an admin. Use after
// `authorize('employer')`.
//
// The UI already hides the Post Job form for unapproved employers (see
// PostJob.jsx), but that is presentation, not enforcement: a pending employer
// holding a valid token could POST /api/jobs directly and have the listing go
// live, bypassing the approval step entirely. This is where the rule actually
// holds.
//
// Scoped to *creating* jobs. Editing and deleting stay governed by the
// ownership check in their controllers — an employer who is rejected after
// posting still needs to be able to close their own live listings.
export function requireApprovedEmployer(req, res, next) {
  if (req.user.employerStatus === 'approved') return next()

  return res.status(403).json({
    success: false,
    employerNotApproved: true,
    message:
      req.user.employerStatus === 'rejected'
        ? 'Your employer account was not approved, so you cannot post jobs. Contact support if you believe this is a mistake.'
        : 'Your employer account is still awaiting admin approval. You will be able to post jobs once an admin has reviewed it.',
  })
}

// Restricts a route to specific roles. Use after `protect`.
// Example: router.post('/jobs', protect, authorize('employer'), createJob)
export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to perform this action`,
      })
    }
    next()
  }
}