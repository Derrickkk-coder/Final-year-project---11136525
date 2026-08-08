import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'
import { sendEmail, verificationEmailTemplate, passwordResetEmailTemplate } from '../utils/sendEmail.js'
import { generateVerificationToken, hashToken } from '../utils/generateVerificationToken.js'
import { cleanSkills } from '../utils/cleanSkills.js'
import { STUDENT_LEVELS } from '../utils/studentFriendly.js'

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

// Don't send another verification email if one went out in the last minute.
// Without this, holding down the Resend button floods the inbox and burns the
// Brevo free-tier quota. The response is identical either way, so a caller
// can't tell a throttled request from a sent one.
const RESEND_THROTTLE_MS = 60 * 1000

// @route   POST /api/auth/resend-verification
// @access  Public
//
// This previously contained a copy of the login handler: it returned 403
// "please verify your email" for unverified accounts — the exact case it exists
// to serve — and for verified accounts it minted an unused token and claimed to
// have sent a mail without calling the mailer at all. It now actually resends.
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' })
    }

    // verificationTokenExpires is select:false on the schema, so ask for it
    // explicitly — the throttle below reads it.
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+verificationTokenExpires')

    // Same generic reply as forgot-password, so this endpoint can't be used to
    // discover which email addresses have accounts.
    if (!user) {
      console.log(`[email] Resend requested for unknown email: ${email}`)
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact support if you believe this is a mistake.',
      })
    }

    // Nothing to verify. Worth saying plainly rather than sending a pointless
    // email — and it reveals nothing, since the caller reached this button by
    // failing a login with this very address.
    if (user.isVerified) {
      return res.json({
        success: true,
        alreadyVerified: true,
        message: 'This account is already verified — you can log in.',
      })
    }

    const issuedAt = user.verificationTokenExpires
      ? new Date(user.verificationTokenExpires).getTime() - VERIFICATION_TOKEN_TTL_MS
      : 0

    if (Date.now() - issuedAt < RESEND_THROTTLE_MS) {
      console.log(`[email] Resend throttled for ${user.email}`)
      return res.json({
        success: true,
        message: 'Verification email sent. Please check your inbox, including spam.',
      })
    }

    // Fire-and-forget, like registration: a slow mail provider shouldn't hold
    // up the response, and the message is the same either way.
    issueVerificationEmail(user)

    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox, including spam.',
    })
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
// Drops rows the user added but left completely blank, so an accidental "add
// another" click doesn't persist an empty education entry.
function cleanEntries(entries, fields) {
  if (!Array.isArray(entries)) return []

  return entries
    .map((entry) => {
      const cleaned = {}
      fields.forEach((field) => {
        cleaned[field] = String(entry?.[field] || '').trim()
      })
      return cleaned
    })
    .filter((entry) => fields.some((field) => entry[field]))
}

export async function updateProfile(req, res, next) {
  try {
    const {
      name, company, companyDescription, companyWebsite, profilePictureUrl,
      bio, location, phone, resumeUrl, skills, education, experience, certifications,
      student,
    } = req.body

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' })
      }
      req.user.name = name
    }
    if (company !== undefined) req.user.company = company
    if (companyDescription !== undefined) req.user.companyDescription = companyDescription
    if (companyWebsite !== undefined) req.user.companyWebsite = companyWebsite
    if (profilePictureUrl !== undefined) req.user.profilePictureUrl = profilePictureUrl

    // ---- Job seeker profile ----
    if (bio !== undefined) req.user.bio = bio
    if (location !== undefined) req.user.location = location
    if (phone !== undefined) req.user.phone = phone
    if (resumeUrl !== undefined) req.user.resumeUrl = resumeUrl
    if (skills !== undefined) req.user.skills = cleanSkills(skills)

    if (education !== undefined) {
      req.user.education = cleanEntries(education, ['institution', 'qualification', 'startYear', 'endYear'])
    }
    if (experience !== undefined) {
      req.user.experience = cleanEntries(experience, ['company', 'role', 'startYear', 'endYear', 'summary'])
    }
    if (certifications !== undefined) {
      req.user.certifications = cleanEntries(certifications, ['name', 'issuer', 'year'])
    }

    if (student !== undefined) {
      // Level is validated by the schema enum, so pass undefined rather than ''
      // for "not chosen" — an empty string would fail validation.
      req.user.student = {
        isStudent: Boolean(student?.isStudent),
        institution: String(student?.institution || '').trim(),
        level: STUDENT_LEVELS.includes(student?.level) ? student.level : undefined,
        fieldOfStudy: String(student?.fieldOfStudy || '').trim(),
        graduationYear: String(student?.graduationYear || '').trim(),
      }
    }

    await req.user.save()

    res.json({ success: true, user: req.user })
  } catch (err) {
    next(err)
  }
}
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour — shorter than email verification's 24h,
// standard practice for password reset links since they grant account access.

// Fire-and-forget, same reasoning as verification emails: a slow/failed send
// should never block or crash the request. The response message is generic
// either way (see forgotPassword below), so there's nothing to await here.
async function issuePasswordResetEmail(user) {
  try {
    const { rawToken, hashedToken } = generateVerificationToken()
    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = Date.now() + RESET_TOKEN_TTL_MS
    await user.save()

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`
    await sendEmail({
      to: user.email,
      subject: 'Reset your NextLeap password',
      html: passwordResetEmailTemplate({ name: user.name, resetUrl }),
    })
    console.log(`[email] Password reset email SENT to ${user.email}`)
  } catch (err) {
    console.error(`[email] FAILED to send password reset email to ${user.email}:`, err.message)
  }
}

// @route   POST /api/auth/forgot-password
// @access  Public
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (user) {
      issuePasswordResetEmail(user)
    } else {
      console.log(`[email] Password reset requested for unknown email: ${email}`)
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (err) {
    next(err)
  }
}

// @route   POST /api/auth/reset-password/:token
// @access  Public
export async function resetPassword(req, res, next) {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
    }

    const hashedToken = hashToken(token)

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has expired. Please request a new one.',
      })
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ success: true, message: 'Your password has been reset. You can now log in.' })
  } catch (err) {
    next(err)
  }
}