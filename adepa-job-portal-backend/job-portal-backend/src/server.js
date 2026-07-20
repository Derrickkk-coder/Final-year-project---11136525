import dotenv from 'dotenv'
dotenv.config()

import { connectDB } from './config/db.js'
import app from './app.js'

const PORT = process.env.PORT || 5000

async function start() {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`Adepa API running on http://localhost:${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/api/health`)
  })
}

start()
