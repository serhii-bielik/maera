import { FilterType, FilterMode, FilterLogic, type ClickContext } from '@maera/shared'

export interface FilterConfig {
  type: FilterType
  mode: FilterMode
  values: string[]
}

// Интерфейс для каждого обработчика фильтра
interface FilterHandler {
  evaluate(ctx: ClickContext, values: string[], mode: FilterMode): boolean
}

// ─── Обработчики фильтров ─────────────────────────────────

class CountryFilter implements FilterHandler {
  evaluate(ctx: ClickContext, values: string[], mode: FilterMode): boolean {
    const country = ctx.country?.toUpperCase() ?? ''
    const match = values.map((v) => v.toUpperCase()).includes(country)
    return mode === FilterMode.IS ? match : !match
  }
}

class LanguageFilter implements FilterHandler {
  evaluate(ctx: ClickContext, values: string[], mode: FilterMode): boolean {
    const language = ctx.language?.toLowerCase() ?? ''
    const match = values.map((v) => v.toLowerCase()).some((v) => language.startsWith(v))
    return mode === FilterMode.IS ? match : !match
  }
}

class UserAgentFilter implements FilterHandler {
  evaluate(ctx: ClickContext, values: string[], mode: FilterMode): boolean {
    const ua = ctx.userAgent?.toLowerCase() ?? ''
    const match = values.some((v) => ua.includes(v.toLowerCase()))
    return mode === FilterMode.IS ? match : !match
  }
}

class BotFilter implements FilterHandler {
  evaluate(ctx: ClickContext, values: string[], mode: FilterMode): boolean {
    const match = ctx.isBot
    return mode === FilterMode.IS ? match : !match
  }
}

class DeviceTypeFilter implements FilterHandler {
  evaluate(ctx: ClickContext, values: string[], mode: FilterMode): boolean {
    const device = ctx.device?.toLowerCase() ?? ''
    const match = values.map((v) => v.toLowerCase()).includes(device)
    return mode === FilterMode.IS ? match : !match
  }
}

class OsFilter implements FilterHandler {
  evaluate(ctx: ClickContext, values: string[], mode: FilterMode): boolean {
    const os = ctx.os?.toLowerCase() ?? ''
    const match = values.some((v) => os.includes(v.toLowerCase()))
    return mode === FilterMode.IS ? match : !match
  }
}

class IpFilter implements FilterHandler {
  evaluate(ctx: ClickContext, values: string[], mode: FilterMode): boolean {
    const match = values.includes(ctx.ip)
    return mode === FilterMode.IS ? match : !match
  }
}

// ─── Реестр фильтров ──────────────────────────────────────

const filterRegistry = new Map<FilterType, FilterHandler>([
  [FilterType.COUNTRY, new CountryFilter()],
  [FilterType.LANGUAGE, new LanguageFilter()],
  [FilterType.USER_AGENT, new UserAgentFilter()],
  [FilterType.BOT, new BotFilter()],
  [FilterType.DEVICE_TYPE, new DeviceTypeFilter()],
  [FilterType.OS, new OsFilter()],
  [FilterType.IP, new IpFilter()],
])

// ─── Главная функция ──────────────────────────────────────

export function evaluateFilters(
  filters: FilterConfig[],
  logic: FilterLogic,
  context: ClickContext
): boolean {
  if (filters.length === 0) return true

  const results = filters.map((filter) => {
    const handler = filterRegistry.get(filter.type)
    if (!handler) {
      console.warn(`Unknown filter type: ${filter.type}`)
      return true
    }
    return handler.evaluate(context, filter.values, filter.mode)
  })

  return logic === FilterLogic.AND ? results.every(Boolean) : results.some(Boolean)
}

// Найти подходящий поток для контекста
export function findMatchingFlow<
  T extends {
    id: string
    isDefault: boolean
    isActive: boolean
    filterLogic: FilterLogic
    filters: FilterConfig[]
  },
>(flows: T[], context: ClickContext): T | null {
  const sorted = [...flows].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return 1
    if (!a.isDefault && b.isDefault) return -1
    return 0
  })

  for (const flow of sorted) {
    if (!flow.isActive) continue
    if (flow.isDefault) return flow
    if (evaluateFilters(flow.filters, flow.filterLogic, context)) {
      return flow
    }
  }

  return null
}
