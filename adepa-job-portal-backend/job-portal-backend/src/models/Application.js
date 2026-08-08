import mongoose from 'mongoose'

// Its own schema rather than an inline object so `mode`'s enum can't be confused
// with Mongoose's own `type` keyword. _id disabled — there is at most one
// interview per application, so it needs no identity of its own.
const interviewSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, required: true },
    mode: { type: String, enum: ['On-site', 'Phone', 'Video'], default: 'Video' },
    // Address, phone number, or meeting link, depending on mode
    details: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    setAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

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
    // Ordered as a hiring funnel: received -> being read -> shortlisted for
    // interview -> offered, with rejected available at any point. `shortlisted`
    // sits between review and accepted so "shortlist this candidate" is a real
    // state change rather than a label on top of 'review'.
    status: {
      type: String,
      enum: ['pending', 'review', 'shortlisted', 'accepted', 'rejected'],
      default: 'pending',
    },
    // Set once an employer schedules an interview. Absent until then.
    interview: {
      type: interviewSchema,
      default: undefined,
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