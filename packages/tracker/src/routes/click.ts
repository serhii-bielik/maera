import type { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import { getGeoData } from '../services/geo'
import { parseUA } from '../services/ua'
import { findMatchingFlow } from '../services/filter'
import { checkUniqueness } from '../services/unique'
import { clickQueue } from '../services/queue'
import { FilterLogic, FilterMode, FilterType, UniquenessType } from '@maera/shared'

export async function clickRoutes(app: FastifyInstance) {
  app.get('/:alias', async (request: FastifyRequest<{ Params: { alias: string } }>, reply) => {
    const { alias } = request.params
    const startTime = Date.now()

    // 1. Найти кампанию по alias
    const campaign = await prisma.campaign.findUnique({
      where: { alias, isActive: true },
      include: {
        flows: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
          include: { filters: true },
        },
      },
    })

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' })
    }

    // 2. Получить IP
    const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip

    // 3. Парсим User Agent
    const userAgent = request.headers['user-agent'] ?? null
    const uaData = parseUA(userAgent)

    // 4. Определяем гео
    const geoData = await getGeoData(ip)

    // 5. Получаем язык из заголовка
    const language =
      (request.headers['accept-language'] as string)?.split(',')[0]?.split(';')[0] ?? null

    // 6. Cookie ID для уникальности
    const cookieId = (request.cookies as Record<string, string>)?.['maera_uid'] ?? null

    // 7. Строим контекст клика
    const context = {
      ip,
      country: geoData.country,
      city: geoData.city,
      language,
      userAgent: uaData.userAgent,
      browser: uaData.browser,
      os: uaData.os,
      device: uaData.device,
      isBot: uaData.isBot,
      cookieId,
      referrer: (request.headers['referer'] as string) ?? null,
    }

    // 8. Преобразуем фильтры из БД в нужный формат
    const flows = campaign.flows.map((flow) => ({
      ...flow,
      filterLogic: flow.filterLogic as FilterLogic,
      filters: flow.filters.map((f) => ({
        type: f.type as FilterType,
        mode: f.mode as FilterMode,
        values: f.values as string[],
      })),
    }))

    // 9. Находим подходящий поток
    const matchedFlow = findMatchingFlow(flows, context)

    if (!matchedFlow) {
      return reply.status(404).send({ error: 'No matching flow' })
    }

    // 10. Проверяем уникальность
    const isUnique = await checkUniqueness({
      campaignId: campaign.id,
      ip,
      userAgent: uaData.userAgent,
      cookieId,
      uniqueness: campaign.uniqueness as UniquenessType,
      ttlHours: campaign.uniquenessTtl,
    })

    // 11. Ставим cookie если нужно
    if (campaign.useCookies && isUnique) {
      const uid = crypto.randomUUID()
      reply.header(
        'Set-Cookie',
        `maera_uid=${uid}; Max-Age=${campaign.uniquenessTtl * 3600}; HttpOnly; SameSite=Lax`
      )
    }

    // 12. Асинхронно записываем клик в очередь
    if (matchedFlow.collectClicks) {
      await clickQueue.add('click', {
        campaignId: campaign.id,
        flowId: matchedFlow.id,
        ip,
        country: geoData.country,
        city: geoData.city,
        language,
        userAgent: uaData.userAgent,
        browser: uaData.browser,
        os: uaData.os,
        device: uaData.device,
        referrer: context.referrer,
        isBot: uaData.isBot,
        isUnique,
      })
    }

    const elapsed = Date.now() - startTime
    app.log.info(`Click processed in ${elapsed}ms → ${matchedFlow.name}`)

    // 13. Выполняем редирект или действие
    if (matchedFlow.type === 'URL' && matchedFlow.url) {
      switch (matchedFlow.redirectType) {
        case 'HTTP_301':
          return reply.redirect(matchedFlow.url, 301)
        case 'HTTP_302':
          return reply.redirect(matchedFlow.url, 302)
        case 'META':
          return reply
            .type('text/html')
            .send(
              `<html><head><meta http-equiv="refresh" content="0;url=${matchedFlow.url}"></head></html>`
            )
        case 'JS':
          return reply
            .type('text/html')
            .send(
              `<html><head><script>window.location.href='${matchedFlow.url}'</script></head></html>`
            )
        default:
          return reply.redirect(matchedFlow.url, 302)
      }
    }

    // ACTION тип
    switch (matchedFlow.action) {
      case 'NOT_FOUND':
        return reply.status(404).send('<h1>404 Not Found</h1>')
      case 'FORBIDDEN':
        return reply.status(403).send('<h1>403 Forbidden</h1>')
      case 'SHOW_HTML':
        return reply.type('text/html').send(matchedFlow.actionContent ?? '')
      case 'SHOW_TEXT':
        return reply.type('text/plain').send(matchedFlow.actionContent ?? '')
      default:
        return reply.status(404).send()
    }
  })
}
