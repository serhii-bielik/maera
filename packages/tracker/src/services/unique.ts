import { redis } from '../lib/redis'
import { UniquenessType } from '@maera/shared'

export async function checkUniqueness(params: {
  campaignId: string
  ip: string
  userAgent: string | null
  cookieId: string | null
  uniqueness: UniquenessType
  ttlHours: number
}): Promise<boolean> {
  const { campaignId, ip, userAgent, cookieId, uniqueness, ttlHours } = params

  let key: string

  switch (uniqueness) {
    case UniquenessType.IP_USER_AGENT:
      key = `unique:${campaignId}:${ip}:${userAgent ?? 'empty'}`
      break
    case UniquenessType.IP_ONLY:
      key = `unique:${campaignId}:${ip}`
      break
    case UniquenessType.PARAMETER:
      key = `unique:${campaignId}:cookie:${cookieId ?? ip}`
      break
    default:
      key = `unique:${campaignId}:${ip}`
  }

  const exists = await redis.exists(key)

  if (!exists) {
    await redis.setex(key, ttlHours * 3600, '1')
    return true // уникальный
  }

  return false // не уникальный
}
