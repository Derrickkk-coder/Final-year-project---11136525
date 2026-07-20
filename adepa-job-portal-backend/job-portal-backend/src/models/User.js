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
      select: false, // never return password in queries by default
    },
    role: {
      type: String,
      enum: ['seeker', 'employer'],
      required: [true, 'Role is required'],
    },
    // Only relevant for employer accounts
    company: {
      type: String,
      trim: true,
      default: '',
    },
    // Only relevant for seeker accounts — populated later when we add profile/resume features
    resumeUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

// Hash the password before saving, but only if it was modified (e.g. not on every profile update)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Instance method to check a plaintext password against the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Strip sensitive/internal fields whenever a user document is sent as JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.__v
  return obj
}

const User = mongoose.model('User', userSchema)

export default User