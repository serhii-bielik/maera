import { describe, it, expect } from 'vitest'
import { evaluateFilters, findMatchingFlow } from '../services/filter'
import { FilterType, FilterMode, FilterLogic, type ClickContext } from '@maera/shared'

const baseContext: ClickContext = {
  ip: '1.2.3.4',
  country: 'US',
  city: 'New York',
  language: 'en-US',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
  browser: 'Chrome',
  os: 'Windows',
  device: 'desktop',
  isBot: false,
  cookieId: null,
  referrer: null,
}

describe('evaluateFilters', () => {
  it('returns true when no filters', () => {
    expect(evaluateFilters([], FilterLogic.AND, baseContext)).toBe(true)
  })

  it('matches country IS filter', () => {
    const filters = [{ type: FilterType.COUNTRY, mode: FilterMode.IS, values: ['US', 'DE'] }]
    expect(evaluateFilters(filters, FilterLogic.AND, baseContext)).toBe(true)
  })

  it('excludes country IS_NOT filter', () => {
    const filters = [{ type: FilterType.COUNTRY, mode: FilterMode.IS_NOT, values: ['RU', 'CN'] }]
    expect(evaluateFilters(filters, FilterLogic.AND, baseContext)).toBe(true)
  })

  it('rejects when country not in IS list', () => {
    const filters = [{ type: FilterType.COUNTRY, mode: FilterMode.IS, values: ['DE', 'FR'] }]
    expect(evaluateFilters(filters, FilterLogic.AND, baseContext)).toBe(false)
  })

  it('handles AND logic — all must match', () => {
    const filters = [
      { type: FilterType.COUNTRY, mode: FilterMode.IS, values: ['US'] },
      { type: FilterType.BOT, mode: FilterMode.IS_NOT, values: ['true'] },
    ]
    expect(evaluateFilters(filters, FilterLogic.AND, baseContext)).toBe(true)
  })

  it('handles AND logic — fails if one fails', () => {
    const filters = [
      { type: FilterType.COUNTRY, mode: FilterMode.IS, values: ['US'] },
      { type: FilterType.BOT, mode: FilterMode.IS, values: ['true'] }, // бот IS true, но isBot=false
    ]
    expect(evaluateFilters(filters, FilterLogic.AND, baseContext)).toBe(false)
  })

  it('handles OR logic — passes if one matches', () => {
    const filters = [
      { type: FilterType.COUNTRY, mode: FilterMode.IS, values: ['RU'] }, // false
      { type: FilterType.BOT, mode: FilterMode.IS_NOT, values: ['true'] }, // true
    ]
    expect(evaluateFilters(filters, FilterLogic.OR, baseContext)).toBe(true)
  })

  it('detects bot by user agent', () => {
    const botCtx = { ...baseContext, isBot: true }
    const filters = [{ type: FilterType.BOT, mode: FilterMode.IS, values: ['true'] }]
    expect(evaluateFilters(filters, FilterLogic.AND, botCtx)).toBe(true)
  })

  it('matches language filter', () => {
    const filters = [{ type: FilterType.LANGUAGE, mode: FilterMode.IS, values: ['en'] }]
    expect(evaluateFilters(filters, FilterLogic.AND, baseContext)).toBe(true)
  })

  it('matches device type filter', () => {
    const filters = [{ type: FilterType.DEVICE_TYPE, mode: FilterMode.IS, values: ['desktop'] }]
    expect(evaluateFilters(filters, FilterLogic.AND, baseContext)).toBe(true)
  })
})

describe('findMatchingFlow', () => {
  const makeFlow = (overrides = {}) => ({
    id: 'flow-1',
    isActive: true,
    isDefault: false,
    filterLogic: FilterLogic.AND,
    filters: [] as { type: FilterType; mode: FilterMode; values: string[] }[],
    position: 0,
    ...overrides,
  })

  it('returns flow with no filters', () => {
    const flows = [makeFlow()]
    expect(findMatchingFlow(flows, baseContext)).toBeTruthy()
  })

  it('returns default flow when no match', () => {
    const flows = [
      makeFlow({
        filters: [{ type: FilterType.COUNTRY, mode: FilterMode.IS, values: ['RU'] }],
      }),
      makeFlow({ id: 'default', isDefault: true }),
    ]
    expect(findMatchingFlow(flows, baseContext)?.id).toBe('default')
  })

  it('skips inactive flows', () => {
    const flows = [makeFlow({ isActive: false }), makeFlow({ id: 'flow-2', isDefault: true })]
    expect(findMatchingFlow(flows, baseContext)?.id).toBe('flow-2')
  })

  it('returns null when no flows', () => {
    expect(findMatchingFlow([], baseContext)).toBeNull()
  })
})
