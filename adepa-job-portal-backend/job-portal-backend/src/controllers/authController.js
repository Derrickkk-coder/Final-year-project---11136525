import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'
import { sendEmail, verificationEmailTemplate } from '../utils/sendEmail.js'
import { generateVerificationToken, hashToken } from '../utils/generateVerificationToken.js'

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

async function issueVerificationEmail(user) {
  try {
    const { rawToken, hashedToken } = generateVerificationToken()
    user.verificationToken = hashedToken
    user.verificationTokenExpires = Date.now() + VERIFICATION_TOKEN_TTL_MS
    await user.save()

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`
    await sendEmail({
      to: user.email,
      subject: 'Verify your NextLeap account',
      html: verificationEmailTemplate({ name: user.name, verifyUrl }),
    })
    console.log(`[email] Verification email SENT successfully to ${user.email}`)
  } catch (err) {
    console.error(`[email] FAILED to send verification email to ${user.email}:`, err.message)
  }
}

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

    // NOTE: employers can currently register with any email, including
    // personal providers like Gmail — the earlier free-email-domain
    // restriction has been disabled for now.

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

    issueVerificationEmail(user)

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your account before logging in.',
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

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        notVerified: true,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
      })
    }

    const token = generateToken(user)

    res.json({
      success: true,
      token,
      user,
    })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/auth/verify-email/:token
// @access  Public
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.params
    const hashedToken = hashToken(token)

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This verification link is invalid or has expired. Please request a new one.',
      })
    }

    user.isVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined
    await user.save()

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' })
  } catch (err) {
    next(err)
  }
}

// @route   POST /api/auth/resend-verification
// @access  Public
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      console.log(`[email] Resend requested for unknown email: ${email}`)
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified. Please log in.',
      })
    }

    issueVerificationEmail(user)

    res.json({ success: true, message: 'Verification email sent. Please check your inbox.' })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/auth/me
// @access  Private
export async function getMe(req, res, next) {
  try {
    res.json({ success: true, user: req.user })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/auth/profile
// @access  Private
// Lets the logged-in user update their own profile fields. Currently used by
// the employer "Company profile" page, but written generically enough to
// reuse for a job seeker profile page later.
export async function updateProfile(req, res, next) {
  try {
    const { name, company, companyDescription, companyWebsite } = req.body

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' })
      }
      req.user.name = name
    }
    if (company !== undefined) req.user.company = company
    if (companyDescription !== undefined) req.user.companyDescription = companyDescription
    if (companyWebsite !== undefined) req.user.companyWebsite = companyWebsite

    await req.user.save()

    res.json({ success: true, user: req.user })
  } catch (err) {
    next(err)
  }
}