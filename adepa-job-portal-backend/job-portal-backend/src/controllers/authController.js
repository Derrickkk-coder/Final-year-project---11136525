import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'

// @route   POST /api/auth/register
// @access  Public
export async function register(req, res, next) {
  try {
    const { name, email, password, role, company } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are all required.',
      })
    }

    if (!['seeker', 'employer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'seeker' or 'employer'.",
      })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      company: role === 'employer' ? company || '' : '',
    })

    const token = generateToken(user)

    res.status(201).json({
      success: true,
      token,
      user,
    })
  } catch (err) {
    next(err)
  }
}

// @route   POST /api/auth/login
// @access  Public
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are both required.',
      })
    }

    // Password has `select: false` in the schema, so we explicitly request it here
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const token = generateToken(user)

    res.json({
      success: true,
      token,
      user, // toJSON() on the model strips the password automatically
    })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/auth/me
// @access  Private
export async function getMe(req, res, next) {
  try {
    // req.user is already attached by the `protect` middleware
    res.json({ success: true, user: req.user })
  } catch (err) {
    next(err)
  }
}