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