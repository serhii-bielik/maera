import Fastify from 'fastify'
import { healthRoutes } from './routes/health'
import { clickRoutes } from './routes/click'
import { initGeoIP } from './services/geo'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
    trustProxy: true,
  })

  // Инициализируем GeoIP при старте
  await initGeoIP()

  // Роуты
  app.register(healthRoutes)
  app.register(clickRoutes)

  return app
}
