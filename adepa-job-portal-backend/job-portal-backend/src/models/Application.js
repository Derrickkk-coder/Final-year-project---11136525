import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Optional note from the applicant, shown to the employer alongside their profile
    coverLetter: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'review', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true } // createdAt doubles as "applied at"
)

// A seeker can only apply to a given job once
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true })

const Application = mongoose.model('Application', applicationSchema)

export default Application