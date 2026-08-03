import express from 'express'
import {
  register, login, getMe, verifyEmail, resendVerification, updateProfile,
  forgotPassword, resetPassword,
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)
router.get('/verify-email/:token', verifyEmail)
router.post('/resend-verification', resendVerification)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)

export default router