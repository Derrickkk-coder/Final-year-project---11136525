import express from 'express'
import cors from 'cors'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import jobRoutes from './routes/jobRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'

const app = express()

// ---- Core middleware ----
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ---- Health check ----
// Useful for confirming the server is up, and for Render's health checks later.
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Adepa API is running', timestamp: new Date().toISOString() })
})

// ---- Routes ----
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/notifications', notificationRoutes)

// ---- Error handling (must be last) ----
app.use(notFound)
app.use(errorHandler)
export default app