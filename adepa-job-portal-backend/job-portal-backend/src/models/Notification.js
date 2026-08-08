import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // What produced this. The message is stored pre-rendered (below), but
    // keeping the type lets the UI label each kind differently, and means
    // adding a new kind later doesn't need a migration.
    type: {
      type: String,
      enum: ['application_status', 'new_matching_job'],
      required: true,
    },
    // Rendered at write time rather than assembled in the client. The job title
    // and company are copied in, so the text still reads correctly if the job is
    // later edited, closed, or deleted — a notification is a record of what
    // happened, not a live view of the job.
    message: {
      type: String,
      required: true,
    },
    // Where clicking it should take the reader
    link: {
      type: String,
      default: '/dashboard',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Kept for context and possible future filtering. Deliberately not relied
    // on for display, since either may point at a deleted document.
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
  },
  { timestamps: true }
)

// Every read is "newest first, for one recipient"
notificationSchema.index({ recipient: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
