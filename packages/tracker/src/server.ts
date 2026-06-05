import 'dotenv/config'
import { buildApp } from './app'

const PORT = parseInt(process.env.TRACKER_PORT ?? '3000')
const HOST = process.env.HOST ?? '0.0.0.0'

async function start() {
  const app = buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`🚀 Maera Tracker running at http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
