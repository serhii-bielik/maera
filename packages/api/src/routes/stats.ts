import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

type Period = 'day' | 'week' | 'month'

function getPeriodStart(period: Period): Date {
  const now = new Date()
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
  }
}

export async function statsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // GET /stats?period=day|week|month
  app.get('/stats', async (request) => {
    const { period = 'day' } = request.query as { period?: Period }
    const from = getPeriodStart(period)

    const [total, unique, bots, byCountry, byDevice, recent] = await Promise.all([
      // Всего кликов
      prisma.click.count({ where: { createdAt: { gte: from } } }),

      // Уникальных
      prisma.click.count({
        where: { createdAt: { gte: from }, isUnique: true },
      }),

      // Ботов
      prisma.click.count({
        where: { createdAt: { gte: from }, isBot: true },
      }),

      // По странам
      prisma.click.groupBy({
        by: ['country'],
        where: { createdAt: { gte: from }, country: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // По устройствам
      prisma.click.groupBy({
        by: ['device'],
        where: { createdAt: { gte: from }, device: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // Последние клики
      prisma.click.findMany({
        where: { createdAt: { gte: from } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          ip: true,
          country: true,
          device: true,
          browser: true,
          isBot: true,
          isUnique: true,
          createdAt: true,
          campaign: { select: { id: true, name: true, alias: true } },
        },
      }),
    ])

    return {
      period,
      summary: { total, unique, bots },
      byCountry: byCountry.map((r) => ({
        country: r.country,
        count: r._count.id,
      })),
      byDevice: byDevice.map((r) => ({
        device: r.device,
        count: r._count.id,
      })),
      recent,
    }
  })

  // GET /stats/campaigns/:id?period=day|week|month
  app.get<{ Params: { id: string } }>('/stats/campaigns/:id', async (request, reply) => {
    const { period = 'day' } = request.query as { period?: Period }
    const from = getPeriodStart(period)

    const campaign = await prisma.campaign.findUnique({
      where: { id: request.params.id },
    })

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' })
    }

    const where = {
      campaignId: request.params.id,
      createdAt: { gte: from },
    }

    const [total, unique, bots, byFlow, byCountry] = await Promise.all([
      prisma.click.count({ where }),
      prisma.click.count({ where: { ...where, isUnique: true } }),
      prisma.click.count({ where: { ...where, isBot: true } }),
      prisma.click.groupBy({
        by: ['flowId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.click.groupBy({
        by: ['country'],
        where: { ...where, country: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])

    return {
      campaign: { id: campaign.id, name: campaign.name },
      period,
      summary: { total, unique, bots },
      byFlow: byFlow.map((r) => ({
        flowId: r.flowId,
        count: r._count.id,
      })),
      byCountry: byCountry.map((r) => ({
        country: r.country,
        count: r._count.id,
      })),
    }
  })
}
