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
    resumeUrl: {
      type: String,
      required: [true, 'A resume is required to apply'],
    },
    phone: {
      type: String,
      required: [true, 'A phone number is required to apply'],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'A contact email is required to apply'],
      trim: true,
      lowercase: true,
    },
   status: {
      type: String,
      enum: ['pending', 'review', 'accepted', 'rejected'],
      default: 'pending',
    },
    // AI-generated fit assessment, cached so re-viewing an applicant doesn't
    // re-trigger a paid API call. Employers can request a fresh one manually.
    aiAnalysis: {
      type: String,
      default: '',
    },
    aiAnalyzedAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true })

const Application = mongoose.model('Application', applicationSchema)

export default Application