import { isPrivateIP } from '../utils/ip'

// ─── Интерфейс провайдера ─────────────────────────────────

export interface GeoData {
  country: string | null
  city: string | null
}

export interface IGeoProvider {
  name: string
  init(): Promise<void>
  lookup(ip: string): GeoData | Promise<GeoData>
}

// ─── MaxMind провайдер ────────────────────────────────────

class MaxMindProvider implements IGeoProvider {
  name = 'MaxMind GeoLite2'
  private reader: Awaited<ReturnType<typeof import('@maxmind/geoip2-node').Reader.open>> | null =
    null

  async init(): Promise<void> {
    const { Reader } = await import('@maxmind/geoip2-node')
    const { join } = await import('path')

    const dbPath = process.env.MAXMIND_DB_PATH ?? join(process.cwd(), 'data', 'GeoLite2-City.mmdb')

    try {
      this.reader = await Reader.open(dbPath)
      console.log(`✅ GeoIP: ${this.name} loaded`)
    } catch {
      console.warn(`⚠️  GeoIP: ${this.name} database not found at ${dbPath}`)
      console.warn('   Download GeoLite2-City.mmdb from maxmind.com')
    }
  }

  lookup(ip: string): GeoData {
    if (!this.reader) return { country: null, city: null }

    try {
      const response = this.reader.city(ip)
      return {
        country: response.country?.isoCode ?? null,
        city: response.city?.names?.en ?? null,
      }
    } catch {
      return { country: null, city: null }
    }
  }
}

// ─── Реестр провайдеров ───────────────────────────────────

const providerRegistry: Record<string, () => IGeoProvider> = {
  MAXMIND: () => new MaxMindProvider(),
}

// ─── Активный провайдер ───────────────────────────────────

let activeProvider: IGeoProvider = new MaxMindProvider()

export async function initGeoIP(providerName = 'MAXMIND'): Promise<void> {
  const factory = providerRegistry[providerName]

  if (!factory) {
    console.warn(`⚠️  Unknown GeoIP provider: ${providerName}, falling back to MaxMind`)
    activeProvider = new MaxMindProvider()
  } else {
    activeProvider = factory()
  }

  await activeProvider.init()
}

export async function getGeoData(ip: string): Promise<GeoData> {
  if (isPrivateIP(ip)) return { country: null, city: null }
  return activeProvider.lookup(ip)
}

export function getActiveProviderName(): string {
  return activeProvider.name
}
