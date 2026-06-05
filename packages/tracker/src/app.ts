import Fastify from 'fastify'
import { healthRoutes } from './routes/health'
import { clickRoutes } from './routes/click'

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
    trustProxy: true, // важно для корректного IP за nginx
  })

  // Роуты
  app.register(healthRoutes)
  app.register(clickRoutes)

  return app
}
