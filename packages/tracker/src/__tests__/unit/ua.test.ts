import { describe, it, expect } from 'vitest'
import { parseUA } from '../../services/ua'

describe('parseUA', () => {
  it('detects bot by empty user agent', () => {
    const result = parseUA(null)
    expect(result.isBot).toBe(true)
  })

  it('detects Googlebot', () => {
    const result = parseUA('Mozilla/5.0 (compatible; Googlebot/2.1)')
    expect(result.isBot).toBe(true)
  })

  it('detects curl as bot', () => {
    const result = parseUA('curl/7.68.0')
    expect(result.isBot).toBe(true)
  })

  it('parses Chrome on Windows correctly', () => {
    const result = parseUA(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
    )
    expect(result.isBot).toBe(false)
    expect(result.browser).toBe('Chrome')
    expect(result.os).toBe('Windows')
    expect(result.device).toBe('desktop')
  })

  it('detects mobile device', () => {
    const result = parseUA(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    )
    expect(result.isBot).toBe(false)
    expect(result.device).toBe('mobile')
  })

  it('parses Firefox on Linux', () => {
    const result = parseUA('Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0')
    expect(result.browser).toBe('Firefox')
    expect(result.os).toBe('Linux')
  })
})
