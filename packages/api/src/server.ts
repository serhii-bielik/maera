import 'dotenv/config'
import { buildApp } from './app'

const PORT = parseInt(process.env.API_PORT ?? '3001')
const HOST = process.env.HOST ?? '0.0.0.0'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`🚀 Maera API running at http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start().catch((err) => {
  console.error('Failed to start API:', err)
  process.exit(1)
})
