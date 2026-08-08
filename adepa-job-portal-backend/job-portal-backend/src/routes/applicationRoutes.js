import express from 'express'
import {
  applyToJob,
  getMyApplications,
  getApplicationsForEmployer,
  getApplicationsForJob,
  updateApplicationStatus,
  analyzeApplication,
  scheduleInterview,
  getMyInterviews,
} from '../controllers/applicationController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.post('/', protect, authorize('seeker'), applyToJob)
router.get('/mine', protect, authorize('seeker'), getMyApplications)
router.get('/employer', protect, authorize('employer'), getApplicationsForEmployer)
// Both sides read their own interviews from here — see getMyInterviews
router.get('/interviews', protect, authorize('seeker', 'employer'), getMyInterviews)
router.get('/job/:jobId', protect, authorize('employer'), getApplicationsForJob)
router.put('/:id/status', protect, authorize('employer'), updateApplicationStatus)
router.put('/:id/interview', protect, authorize('employer'), scheduleInterview)
router.post('/:id/analyze', protect, authorize('employer'), analyzeApplication)

export default router