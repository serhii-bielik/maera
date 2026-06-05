import { UAParser } from 'ua-parser-js'

export interface UAData {
  userAgent: string | null
  browser: string | null
  os: string | null
  device: string | null
  isBot: boolean
}

// Список известных ботов
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java\//i,
  /go-http/i,
  /Googlebot/i,
  /bingbot/i,
  /YandexBot/i,
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
]

export function parseUA(userAgent: string | null): UAData {
  if (!userAgent) {
    return {
      userAgent: null,
      browser: null,
      os: null,
      device: null,
      isBot: true, // пустой UA считаем ботом
    }
  }

  const isBot = BOT_PATTERNS.some((pattern) => pattern.test(userAgent))

  if (isBot) {
    return { userAgent, browser: null, os: null, device: null, isBot: true }
  }

  const parser = new UAParser(userAgent)
  const result = parser.getResult()

  const browser = result.browser.name ?? null
  const os = result.os.name ?? null
  const deviceType = result.device.type ?? 'desktop'

  return {
    userAgent,
    browser,
    os,
    device: deviceType,
    isBot: false,
  }
}
