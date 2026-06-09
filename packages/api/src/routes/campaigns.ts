import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { createCampaignSchema, updateCampaignSchema } from '../schemas/campaign'
import { generateToken } from '@maera/shared'

export async function campaignRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // GET /campaigns
  app.get('/campaigns', async (request) => {
    const user = request.user as { id: string; role: string }

    const campaigns = await prisma.campaign.findMany({
      where: user.role === 'ADMIN' ? undefined : { users: { some: { userId: user.id } } },
      include: {
        group: { select: { id: true, name: true } },
        _count: { select: { flows: true, clicks: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { campaigns }
  })

  // GET /campaigns/:id
  app.get<{ Params: { id: string } }>('/campaigns/:id', async (request, reply) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: request.params.id },
      include: {
        group: { select: { id: true, name: true } },
        flows: {
          include: { filters: true },
          orderBy: { position: 'asc' },
        },
        _count: { select: { clicks: true } },
      },
    })

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' })
    }

    return { campaign }
  })

  // POST /campaigns
  app.post('/campaigns', async (request, reply) => {
    const result = createCampaignSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation error',
        message: result.error.errors[0].message,
      })
    }

    const data = result.data
    const alias = data.alias ?? generateToken(6)

    const existing = await prisma.campaign.findUnique({ where: { alias } })
    if (existing) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Campaign with this alias already exists',
      })
    }

    const campaign = await prisma.campaign.create({
      data: { ...data, alias },
      include: {
        group: { select: { id: true, name: true } },
      },
    })

    return reply.status(201).send({ campaign })
  })

  // PATCH /campaigns/:id
  app.patch<{ Params: { id: string } }>('/campaigns/:id', async (request, reply) => {
    const result = updateCampaignSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation error',
        message: result.error.errors[0].message,
      })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: request.params.id },
    })

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' })
    }

    const updated = await prisma.campaign.update({
      where: { id: request.params.id },
      data: result.data,
    })

    return { campaign: updated }
  })

  // DELETE /campaigns/:id
  app.delete<{ Params: { id: string } }>('/campaigns/:id', async (request, reply) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: request.params.id },
    })

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' })
    }

    await prisma.campaign.delete({ where: { id: request.params.id } })

    return reply.status(204).send()
  })

  // PATCH /campaigns/:id/toggle — включить/выключить
  app.patch<{ Params: { id: string } }>('/campaigns/:id/toggle', async (request, reply) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: request.params.id },
    })

    if (!campaign) {
      return reply.status(404).send({ error: 'Campaign not found' })
    }

    const updated = await prisma.campaign.update({
      where: { id: request.params.id },
      data: { isActive: !campaign.isActive },
    })

    return { campaign: updated }
  })
}
