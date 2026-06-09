import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { healthRoutes } from './routes/health'
import { authRoutes } from './routes/auth'
import { campaignRoutes } from './routes/campaigns'
import { flowRoutes } from './routes/flows'
import { statsRoutes } from './routes/stats'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  })

  await app.register(cors, {
    origin: process.env.ADMIN_URL ?? 'http://localhost:5173',
    credentials: true,
  })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
  })

  // Роуты
  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(campaignRoutes)
  await app.register(flowRoutes)
  await app.register(statsRoutes)

  return app
}
