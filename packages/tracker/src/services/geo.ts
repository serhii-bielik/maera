// Заглушка для MaxMind

export interface GeoData {
  country: string | null
  city: string | null
}

export async function getGeoData(ip: string): Promise<GeoData> {
  // localhost и приватные IP
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  ) {
    return { country: null, city: null }
  }

  // TODO: заменить на MaxMind в следующей задаче
  return { country: null, city: null }
}
