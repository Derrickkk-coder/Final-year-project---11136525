import express from 'express'
import {
  createJob, getJobs, getJobById, getMyJobs, updateJob, deleteJob, getRecommendedJobs,
} from '../controllers/jobController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// IMPORTANT: specific paths like /mine/list and /recommended/mine must be
// declared before /:id, otherwise Express tries to match them as a job ID.
router.get('/mine/list', protect, authorize('employer'), getMyJobs)
router.get('/recommended/mine', protect, authorize('seeker'), getRecommendedJobs)

router.get('/', getJobs)
router.get('/:id', getJobById)

router.post('/', protect, authorize('employer'), createJob)
router.put('/:id', protect, authorize('employer'), updateJob)
router.delete('/:id', protect, authorize('employer'), deleteJob)

export default router