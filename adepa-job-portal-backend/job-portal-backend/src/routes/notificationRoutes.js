import express from 'express'
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Every notification is personal to the logged-in user — there is no role
// distinction here, so `protect` alone covers the whole router.
router.use(protect)

router.get('/', getMyNotifications)

// Declared before /:id/read so "read-all" is never parsed as an id
router.put('/read-all', markAllAsRead)
router.put('/:id/read', markAsRead)

export default router
