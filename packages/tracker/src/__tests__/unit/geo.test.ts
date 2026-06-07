import { describe, it, expect } from 'vitest'
import { getGeoData } from '../../services/geo'

describe('getGeoData', () => {
  it('returns null for localhost', async () => {
    const result = await getGeoData('127.0.0.1')
    expect(result.country).toBeNull()
    expect(result.city).toBeNull()
  })

  it('returns null for private IP 192.168.x.x', async () => {
    const result = await getGeoData('192.168.1.1')
    expect(result.country).toBeNull()
  })

  it('returns null for private IP 10.x.x.x', async () => {
    const result = await getGeoData('10.0.0.1')
    expect(result.country).toBeNull()
  })

  it('returns null for IPv6 localhost', async () => {
    const result = await getGeoData('::1')
    expect(result.country).toBeNull()
  })

  it('returns data structure for public IP', async () => {
    const result = await getGeoData('8.8.8.8')
    expect(result).toHaveProperty('country')
    expect(result).toHaveProperty('city')
  })
})
