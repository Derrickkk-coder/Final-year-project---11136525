import mongoose from 'mongoose'

const supportMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportConversation',
      required: true,
    },
    // Which side sent it. 'system' covers the automatic notes a thread needs —
    // "connected to support", "conversation closed" — which belong in the
    // transcript but aren't from a person.
    from: {
      type: String,
      enum: ['user', 'admin', 'system'],
      required: true,
    },
    // Who exactly, when it was an admin — so a thread picked up by two admins
    // reads correctly rather than as one anonymous voice.
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
  },
  { timestamps: true }
)

// Every read is "this conversation, in order"
supportMessageSchema.index({ conversation: 1, createdAt: 1 })

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema)

export default SupportMessage
