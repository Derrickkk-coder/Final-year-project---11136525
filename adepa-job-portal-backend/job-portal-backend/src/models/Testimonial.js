import mongoose from 'mongoose'

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    // Which side of the platform they're speaking from
    authorType: {
      type: String,
      enum: ['seeker', 'employer'],
      required: true,
    },
    // Free text shown under the name — "Hired as Frontend Engineer", "HR Lead"
    role: {
      type: String,
      trim: true,
      default: '',
      maxlength: [80, 'Role cannot exceed 80 characters'],
    },
    company: {
      type: String,
      trim: true,
      default: '',
      maxlength: [80, 'Company cannot exceed 80 characters'],
    },
    quote: {
      type: String,
      required: [true, 'A comment is required'],
      trim: true,
      minlength: [20, 'Please write at least 20 characters'],
      maxlength: [400, 'Comment cannot exceed 400 characters'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    // Anyone can submit without an account, so nothing is public until an admin
    // says so. Without this, the first person to find the endpoint could put
    // arbitrary text on the landing page.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // Kept only to make repeat abuse identifiable during moderation. Never
    // returned by the public endpoint — see PUBLIC_FIELDS in the controller.
    submittedFromIp: {
      type: String,
      select: false,
    },
    // Set once, at submission, by moderateTestimonial.js. `null` means the
    // call failed or was skipped rather than "neutral" — the comment still got
    // a status (falls back to pending either way), this just records whether
    // an AI actually looked at it and what it decided, so a status of
    // "approved" is auditable as either "the AI called this positive" or
    // "an admin looked at it" rather than looking the same either way.
    aiSentiment: {
      type: String,
      enum: ['positive', 'not_positive', null],
      default: null,
    },
    aiReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
)

// Every public read is "approved, newest first"
testimonialSchema.index({ status: 1, createdAt: -1 })

const Testimonial = mongoose.model('Testimonial', testimonialSchema)

export default Testimonial
