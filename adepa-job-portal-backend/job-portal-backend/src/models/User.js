import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['seeker', 'employer', 'admin'],
      required: [true, 'Role is required'],
    },
    // Only meaningful for employer accounts. Admins manually approve new
    // employers before they can post jobs — see the Admin Dashboard.
    // NOTE: admin accounts can never be created via public registration —
    // they must be promoted manually (e.g. directly in MongoDB Atlas).
    employerStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // ---- Employer profile fields ----
    company: {
      type: String,
      trim: true,
      default: '',
    },
    companyDescription: {
      type: String,
      trim: true,
      default: '',
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: '',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    // ---- Job seeker profile ----
    // Sub-documents keep their default _id, which gives React a stable key for
    // each row in the repeatable editors on the profile page.
    bio: {
      type: String,
      trim: true,
      default: '',
      maxlength: [800, 'Bio cannot exceed 800 characters'],
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    // Drives the job match score — see utils/matchScore.js
    skills: {
      type: [String],
      default: [],
    },
    education: [
      {
        institution: { type: String, trim: true, default: '' },
        qualification: { type: String, trim: true, default: '' },
        startYear: { type: String, trim: true, default: '' },
        endYear: { type: String, trim: true, default: '' },
      },
    ],
    experience: [
      {
        company: { type: String, trim: true, default: '' },
        role: { type: String, trim: true, default: '' },
        startYear: { type: String, trim: true, default: '' },
        endYear: { type: String, trim: true, default: '' },
        summary: { type: String, trim: true, default: '' },
      },
    ],
    certifications: [
      {
        name: { type: String, trim: true, default: '' },
        issuer: { type: String, trim: true, default: '' },
        year: { type: String, trim: true, default: '' },
      },
    ],
    // ---- Student / recent graduate ----
    // Opt-in: isStudent drives whether recommendations prioritise internships,
    // national service and entry-level roles. Kept as its own group rather than
    // squeezed into education[] because that array is a history of what someone
    // has completed, whereas this is a statement about where they are now.
    student: {
      isStudent: { type: Boolean, default: false },
      institution: { type: String, trim: true, default: '' },
      level: {
        type: String,
        enum: [
          'Level 100',
          'Level 200',
          'Level 300',
          'Level 400',
          'Postgraduate',
          'Recent graduate',
          'National Service',
        ],
      },
      fieldOfStudy: { type: String, trim: true, default: '' },
      graduationYear: { type: String, trim: true, default: '' },
    },
    // Cached AI CV review. select:false so it doesn't ride along on every
    // /auth/me response — the CV endpoints ask for it explicitly.
    //
    // analyzedResumeUrl records which CV produced this. Replacing the CV makes
    // the stored review stale, and comparing the two is how we know: a review of
    // a document the user has since replaced is worse than no review at all.
    cvAnalysis: {
      type: {
        overallScore: Number,
        areas: [{ name: String, score: Number, comment: String }],
        suggestions: [String],
        strengths: [String],
        analyzedResumeUrl: String,
        analyzedAt: Date,
      },
      select: false,
      default: undefined,
    },
    // Profile picture — Cloudinary URL. Used for both seekers and employers,
    // shown in the navbar and (for seekers) in the employer's applicant list.
    profilePictureUrl: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    // ---- Email verification ----
    isVerified: {
      type: Boolean,
      default: false,
    },
    // General account deactivation, independent of employer approval status.
    // An admin can deactivate any account (seeker, employer, or another
    // admin's misuse case) — a deactivated account cannot log in.
    isActive: {
      type: Boolean,
      default: true,
    },
verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpires: {
      type: Date,
      select: false,
    },
    // ---- Password reset ----
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.verificationToken
  delete obj.verificationTokenExpires
  delete obj.resetPasswordToken
  delete obj.resetPasswordExpires
  delete obj.__v
  return obj
}

const User = mongoose.model('User', userSchema)

export default User