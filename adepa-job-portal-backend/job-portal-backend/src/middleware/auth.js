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

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized — invalid or expired token' })
  }
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