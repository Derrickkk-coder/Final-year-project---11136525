import dotenv from 'dotenv'
dotenv.config()

import { connectDB } from './config/db.js'
import app from './app.js'

const PORT = process.env.PORT || 5000

// Variables the app runs without but silently loses a feature to. Emails and AI
// analysis are both fire-and-forget, so a missing key here shows up only as a
// feature that quietly never works — which is exactly how EMAIL_USER went
// unnoticed in production. Say so at boot instead.
const OPTIONAL_ENV = [
  ['EMAIL_USER', 'verification and status emails will fail to send'],
  ['BREVO_API_KEY', 'verification and status emails will fail to send'],
  ['GEMINI_API_KEY', 'AI resume analysis will fail'],
  ['CLIENT_URL', 'CORS and the links inside emails will point at localhost'],
]

function warnAboutMissingEnv() {
  const missing = OPTIONAL_ENV.filter(([key]) => !process.env[key])
  if (missing.length === 0) return

  console.warn('\n  ⚠ Missing environment variables:')
  missing.forEach(([key, consequence]) => {
    console.warn(`    • ${key} — ${consequence}`)
  })
  console.warn('  See .env.example for what each one needs.\n')
}

async function start() {
  warnAboutMissingEnv()

  await connectDB()

  app.listen(PORT, () => {
    console.log(`NextLeap API running on http://localhost:${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/api/health`)
  })
}

start()