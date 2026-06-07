import type { FastifyInstance } from 'fastify'
import { getGeoData, getActiveProviderName } from '../services/geo'

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    const testGeo = await getGeoData('8.8.8.8')
    const geoEnabled = testGeo.country !== null

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      geoip: {
        enabled: geoEnabled,
        provider: getActiveProviderName(),
      },
    }
  })
}
