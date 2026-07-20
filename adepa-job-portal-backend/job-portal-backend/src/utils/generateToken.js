import jwt from 'jsonwebtoken'

// Signs a token carrying the user's id and role. Role is included so
// route middleware can do quick role checks without a DB lookup.
export function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}