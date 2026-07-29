import express from 'express'
import {
  getEmployers,
  approveEmployer,
  rejectEmployer,
  getStats,
  getAllUsers,
  setUserActiveStatus,
  getAllJobsAdmin,
  deleteJobAdmin,
} from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.use(protect, authorize('admin'))

router.get('/stats', getStats)

router.get('/employers', getEmployers)
router.put('/employers/:id/approve', approveEmployer)
router.put('/employers/:id/reject', rejectEmployer)

router.get('/users', getAllUsers)
router.put('/users/:id/status', setUserActiveStatus)

router.get('/jobs', getAllJobsAdmin)
router.delete('/jobs/:id', deleteJobAdmin)

export default router