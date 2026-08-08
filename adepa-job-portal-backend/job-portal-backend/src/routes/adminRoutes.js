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
import {
  getTestimonialsAdmin,
  setTestimonialStatus,
} from '../controllers/testimonialController.js'
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

// Moderation queue for the landing-page comments
router.get('/testimonials', getTestimonialsAdmin)
router.put('/testimonials/:id/status', setTestimonialStatus)

export default router