import mongoose from 'mongoose'

// A support thread between one user and the admins.
//
// The bot stage isn't represented here at all — it runs entirely in the browser,
// so a conversation only exists once someone asks for a human. That keeps the
// canned Q&A instant and off the database, and means every row in this
// collection is something an admin actually needs to answer.
const supportConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'open', 'closed'],
      default: 'waiting',
    },
    // Whichever admin replied first. Not enforced ownership — any admin can
    // pick up any thread — but it shows who's already involved.
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // What the visitor discussed with the bot before escalating, so an admin
    // opens the thread with context instead of "hello?"
    botTranscript: [
      {
        from: { type: String, enum: ['bot', 'user'] },
        body: String,
      },
    ],
    subject: {
      type: String,
      trim: true,
      default: 'Support request',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Typing indicators are stored as "last keystroke at" rather than a boolean.
    // A boolean needs someone to reliably clear it, and a browser that closes
    // mid-sentence never does — the thread would show "typing…" forever. A
    // timestamp expires on its own; see TYPING_TTL_MS in the controller.
    userTypingAt: Date,
    adminTypingAt: Date,
    unreadForAdmin: { type: Number, default: 0 },
    unreadForUser: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Admin inbox reads "newest activity first"; a user reads their own thread
supportConversationSchema.index({ status: 1, lastMessageAt: -1 })
supportConversationSchema.index({ user: 1, lastMessageAt: -1 })

const SupportConversation = mongoose.model('SupportConversation', supportConversationSchema)

export default SupportConversation
