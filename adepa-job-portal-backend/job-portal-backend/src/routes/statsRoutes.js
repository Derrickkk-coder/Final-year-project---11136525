import express from 'express'
import { getPublicStats } from '../controllers/statsController.js'

const router = express.Router()

// Public by design — these feed the landing page, which anonymous visitors see.
// Aggregate counts only; nothing here identifies a user.
router.get('/', getPublicStats)

export default router
