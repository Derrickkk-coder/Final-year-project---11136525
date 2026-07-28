import dotenv from 'dotenv'
dotenv.config()

import dns from 'node:dns'
// Render's outbound network doesn't reliably route IPv6, but Node's newer
// "Happy Eyeballs" connection behavior can still attempt IPv6 even when an
// individual library (like nodemailer) is told to prefer IPv4. Setting this
// globally, before anything else runs, forces ALL of Node's DNS lookups in
// this process to resolve IPv4 addresses first — the most reliable fix for
// this class of problem on Render/Heroku-style hosts.
dns.setDefaultResultOrder('ipv4first')

import { connectDB } from './config/db.js'
import app from './app.js'

const PORT = process.env.PORT || 5000

async function start() {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`NextLeap API running on http://localhost:${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/api/health`)
  })
}

start()