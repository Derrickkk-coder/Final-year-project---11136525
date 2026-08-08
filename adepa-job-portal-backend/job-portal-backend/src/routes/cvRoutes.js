import express from 'express'
import { getMyCvAnalysis, analyzeMyCv } from '../controllers/cvController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// Seeker-only: this analyses the requester's own CV. Employers review applicant
// CVs through /api/applications/:id/analyze instead.
router.use(protect, authorize('seeker'))

router.get('/analysis', getMyCvAnalysis)
router.post('/analyze', analyzeMyCv)

export default router
