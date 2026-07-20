import express from 'express'
import {
  createJob, getJobs, getJobById, getMyJobs, updateJob, deleteJob,
} from '../controllers/jobController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// IMPORTANT: /mine/list must be declared before /:id, otherwise Express
// will try to match "mine" as a job ID and fail.
router.get('/mine/list', protect, authorize('employer'), getMyJobs)

router.get('/', getJobs)
router.get('/:id', getJobById)

router.post('/', protect, authorize('employer'), createJob)
router.put('/:id', protect, authorize('employer'), updateJob)
router.delete('/:id', protect, authorize('employer'), deleteJob)

export default router