import express from 'express'
import { suggestSkillResources } from '../controllers/skillController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// Seeker-only: this exists to help a seeker close their own skill gap. An
// employer has no missing-skills list of their own to act on.
router.use(protect, authorize('seeker'))

router.post('/resources', suggestSkillResources)

export default router
