import express from 'express'
import {
  applyToJob,
  getMyApplications,
  getApplicationsForEmployer,
  getApplicationsForJob,
  updateApplicationStatus,
  analyzeApplication,
} from '../controllers/applicationController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.post('/', protect, authorize('seeker'), applyToJob)
router.get('/mine', protect, authorize('seeker'), getMyApplications)
router.get('/employer', protect, authorize('employer'), getApplicationsForEmployer)
router.get('/job/:jobId', protect, authorize('employer'), getApplicationsForJob)
router.put('/:id/status', protect, authorize('employer'), updateApplicationStatus)
router.post('/:id/analyze', protect, authorize('employer'), analyzeApplication)

export default router