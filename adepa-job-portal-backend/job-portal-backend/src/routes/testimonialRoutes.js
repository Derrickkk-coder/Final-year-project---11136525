import express from 'express'
import {
  getApprovedTestimonials,
  createTestimonial,
} from '../controllers/testimonialController.js'

const router = express.Router()

// Both public and intentionally so: the landing page shows these to anonymous
// visitors, and anyone can leave one without an account. Nothing submitted here
// is visible until an admin approves it — see the controller.
router.get('/', getApprovedTestimonials)
router.post('/', createTestimonial)

export default router
