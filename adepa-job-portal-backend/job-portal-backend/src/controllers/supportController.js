import SupportConversation from '../models/SupportConversation.js'
import SupportMessage from '../models/SupportMessage.js'
import { notifyUser } from '../utils/notify.js'

// How long a keystroke keeps the "typing…" bubble alive. Comfortably longer than
// the client's heartbeat interval, so a steady typist never flickers, but short
// enough that a closed tab stops claiming to be typing almost immediately.
const TYPING_TTL_MS = 5000

function isTyping(at) {
  return Boolean(at && Date.now() - new Date(at).getTime() < TYPING_TTL_MS)
}

// Shapes a conversation for the client, resolving the raw typing timestamps into
// a single boolean about *the other party* — the caller never needs to know
// whether they themselves are typing.
function present(conversation, viewerRole) {
  const peerTypingAt = viewerRole === 'admin' ? conversation.userTypingAt : conversation.adminTypingAt

  return {
    _id: conversation._id,
    status: conversation.status,
    subject: conversation.subject,
    lastMessageAt: conversation.lastMessageAt,
    peerTyping: isTyping(peerTypingAt),
    unread: viewerRole === 'admin' ? conversation.unreadForAdmin : conversation.unreadForUser,
    botTranscript: conversation.botTranscript || [],
    user: conversation.user,
    assignedAdmin: conversation.assignedAdmin,
  }
}

// An admin may open any thread; a user only their own.
async function loadForViewer(id, user) {
  const conversation = await SupportConversation.findById(id)
  if (!conversation) return { error: 404 }

  if (user.role !== 'admin' && conversation.user.toString() !== user._id.toString()) {
    return { error: 403 }
  }

  return { conversation }
}

// @route   POST /api/support/conversations
// @access  Private (any signed-in user)
//
// Called when someone leaves the bot and asks for a person. Reuses an existing
// open thread rather than starting a second one — a user with two live threads
// would have their replies split across both.
export async function startConversation(req, res, next) {
  try {
    const { botTranscript, subject } = req.body

    const existing = await SupportConversation.findOne({
      user: req.user._id,
      status: { $in: ['waiting', 'open'] },
    })

    if (existing) {
      return res.json({ success: true, conversation: present(existing, req.user.role), resumed: true })
    }

    const conversation = await SupportConversation.create({
      user: req.user._id,
      subject: subject || 'Support request',
      botTranscript: Array.isArray(botTranscript)
        ? botTranscript
            .slice(-20)
            .map((m) => ({
              from: m.from === 'user' ? 'user' : 'bot',
              body: String(m.body || '').slice(0, 500),
            }))
        : [],
      unreadForAdmin: 1,
    })

    await SupportMessage.create({
      conversation: conversation._id,
      from: 'system',
      body: 'You are in the queue for a member of the support team. Someone will reply here shortly.',
    })

    res.status(201).json({ success: true, conversation: present(conversation, req.user.role), resumed: false })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/support/conversations/mine
// @access  Private
export async function getMyConversation(req, res, next) {
  try {
    const conversation = await SupportConversation.findOne({
      user: req.user._id,
      status: { $in: ['waiting', 'open'] },
    }).sort({ lastMessageAt: -1 })

    if (!conversation) return res.json({ success: true, conversation: null })

    res.json({ success: true, conversation: present(conversation, req.user.role) })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/support/conversations/:id/messages?after=<iso>
// @access  Private (owner or admin)
//
// The polling endpoint. `after` keeps responses small — the client already has
// everything older, so only the tail travels. Typing state rides along on the
// same request rather than needing a second one.
export async function getMessages(req, res, next) {
  try {
    const { conversation, error } = await loadForViewer(req.params.id, req.user)
    if (error === 404) return res.status(404).json({ success: false, message: 'Conversation not found.' })
    if (error === 403) return res.status(403).json({ success: false, message: 'Not your conversation.' })

    const filter = { conversation: conversation._id }
    if (req.query.after) {
      const after = new Date(req.query.after)
      if (!Number.isNaN(after.getTime())) filter.createdAt = { $gt: after }
    }

    const messages = await SupportMessage.find(filter)
      .populate('sender', 'name profilePictureUrl')
      .sort({ createdAt: 1 })
      .lean()

    // Opening the thread clears your own unread count, not the other side's
    if (req.user.role === 'admin') {
      if (conversation.unreadForAdmin) {
        conversation.unreadForAdmin = 0
        await conversation.save()
      }
    } else if (conversation.unreadForUser) {
      conversation.unreadForUser = 0
      await conversation.save()
    }

    res.json({
      success: true,
      messages,
      conversation: present(conversation, req.user.role),
    })
  } catch (err) {
    next(err)
  }
}

// @route   POST /api/support/conversations/:id/messages
// @access  Private (owner or admin)
export async function sendMessage(req, res, next) {
  try {
    const { body } = req.body

    if (!body?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' })
    }

    const { conversation, error } = await loadForViewer(req.params.id, req.user)
    if (error === 404) return res.status(404).json({ success: false, message: 'Conversation not found.' })
    if (error === 403) return res.status(403).json({ success: false, message: 'Not your conversation.' })

    if (conversation.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'This conversation has been closed. Start a new one from the help button.',
      })
    }

    const fromAdmin = req.user.role === 'admin'

    const message = await SupportMessage.create({
      conversation: conversation._id,
      from: fromAdmin ? 'admin' : 'user',
      sender: req.user._id,
      body: body.trim(),
    })

    // An admin replying is what takes a thread out of the queue
    if (fromAdmin) {
      if (conversation.status === 'waiting') conversation.status = 'open'
      if (!conversation.assignedAdmin) conversation.assignedAdmin = req.user._id
      conversation.unreadForUser += 1
      // Their own keystrokes are done with; clear so the bubble goes immediately
      conversation.adminTypingAt = undefined
    } else {
      conversation.unreadForAdmin += 1
      conversation.userTypingAt = undefined
    }

    conversation.lastMessageAt = new Date()
    await conversation.save()

    // A user who has closed the widget still gets told support replied
    if (fromAdmin) {
      notifyUser({
        recipient: conversation.user,
        type: 'support_reply',
        message: 'Support has replied to your conversation.',
        link: '/?support=open',
      })
    }

    const populated = await message.populate('sender', 'name profilePictureUrl')

    res.status(201).json({ success: true, message: populated })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/support/conversations/:id/typing
// @access  Private (owner or admin)
// Heartbeat — records that the caller is mid-sentence. Returns nothing useful on
// purpose; it's called often and the response is discarded.
export async function setTyping(req, res, next) {
  try {
    const { conversation, error } = await loadForViewer(req.params.id, req.user)
    if (error) return res.status(error).json({ success: false })

    const field = req.user.role === 'admin' ? 'adminTypingAt' : 'userTypingAt'
    // updateOne rather than save() — this fires every couple of seconds and
    // shouldn't drag the whole document through validation each time.
    await SupportConversation.updateOne({ _id: conversation._id }, { [field]: new Date() })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

// @route   GET /api/support/conversations
// @access  Private (admin only)
export async function listConversations(req, res, next) {
  try {
    const { status } = req.query
    const filter = status && ['waiting', 'open', 'closed'].includes(status) ? { status } : {}

    const conversations = await SupportConversation.find(filter)
      .populate('user', 'name email role profilePictureUrl')
      .populate('assignedAdmin', 'name')
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .lean()

    res.json({
      success: true,
      conversations: conversations.map((c) => ({
        ...c,
        peerTyping: isTyping(c.userTypingAt),
        unread: c.unreadForAdmin,
      })),
      waitingCount: await SupportConversation.countDocuments({ status: 'waiting' }),
    })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/support/conversations/:id/status
// @access  Private (admin only)
export async function setConversationStatus(req, res, next) {
  try {
    const { status } = req.body

    if (!['waiting', 'open', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be waiting, open, or closed.' })
    }

    const conversation = await SupportConversation.findById(req.params.id)
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' })
    }

    conversation.status = status
    if (status === 'closed') {
      await SupportMessage.create({
        conversation: conversation._id,
        from: 'system',
        body: 'This conversation has been closed by support.',
      })
      conversation.unreadForUser += 1
    }

    await conversation.save()

    res.json({ success: true, conversation: present(conversation, 'admin') })
  } catch (err) {
    next(err)
  }
}
