import express from 'express'
import {
  startConversation,
  getMyConversation,
  getMessages,
  sendMessage,
  setTyping,
  listConversations,
  setConversationStatus,
} from '../controllers/supportController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// Everything here needs an account. The bot stage doesn't — it runs in the
// browser and never reaches the server — so signing in is only required at the
// point someone wants a human, which is also the point we need somewhere to
// send the reply.
router.use(protect)

// Admin inbox. Declared before /conversations/:id so "conversations" with no id
// isn't parsed as one.
router.get('/conversations', authorize('admin'), listConversations)
router.put('/conversations/:id/status', authorize('admin'), setConversationStatus)

router.post('/conversations', startConversation)
router.get('/conversations/mine', getMyConversation)

// Owner or admin — the controller checks which
router.get('/conversations/:id/messages', getMessages)
router.post('/conversations/:id/messages', sendMessage)
router.put('/conversations/:id/typing', setTyping)

export default router
