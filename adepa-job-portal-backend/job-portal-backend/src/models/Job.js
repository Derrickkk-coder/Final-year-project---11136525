import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema(
  {
    ref: {
      type: String,
      unique: true,
      // Generated in the pre-save hook below, e.g. "ADP-1042"
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      required: [true, 'Job type is required'],
    },
    remote: {
      type: String,
      enum: ['On-site', 'Hybrid', 'Remote'],
      default: 'On-site',
    },
    salary: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    // Discrete skill tags ("Python", "SQL"), separate from the prose in
    // `requirements`. These are what the seeker match score is computed
    // against — see utils/matchScore.js. Optional: jobs posted before this
    // field existed fall back to a text scan.
    skills: {
      type: [String],
      default: [],
    },
    closingAt: {
      type: Date,
      required: [true, 'Closing date is required'],
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    // The employer (User) who posted this job
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalised counter, kept in sync when applications are created (Step 4)
    applicantsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true } // gives us createdAt (= "posted at") and updatedAt for free
)

// Auto-generate a human-friendly reference code like "ADP-1042" on first save.
// Not perfectly collision-proof under heavy concurrent writes, but more than
// sufficient for this project's scale.
jobSchema.pre('save', async function (next) {
  if (this.ref) return next()

  const count = await mongoose.model('Job').countDocuments()
  this.ref = `ADP-${1000 + count + 1}`
  next()
})

// Text index to support keyword search across title/company/description
jobSchema.index({ title: 'text', company: 'text', description: 'text' })

const Job = mongoose.model('Job', jobSchema)

export default Job