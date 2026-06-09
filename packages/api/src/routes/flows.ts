import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { createFlowSchema, updateFlowSchema } from '../schemas/flow'

export async function flowRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // GET /campaigns/:campaignId/flows
  app.get<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/flows',
    async (request, reply) => {
      const campaign = await prisma.campaign.findUnique({
        where: { id: request.params.campaignId },
      })

      if (!campaign) {
        return reply.status(404).send({ error: 'Campaign not found' })
      }

      const flows = await prisma.flow.findMany({
        where: { campaignId: request.params.campaignId },
        include: { filters: true },
        orderBy: { position: 'asc' },
      })

      return { flows }
    }
  )

  // POST /campaigns/:campaignId/flows
  app.post<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/flows',
    async (request, reply) => {
      const result = createFlowSchema.safeParse(request.body)
      if (!result.success) {
        return reply.status(400).send({
          error: 'Validation error',
          message: result.error.errors[0].message,
        })
      }

      const campaign = await prisma.campaign.findUnique({
        where: { id: request.params.campaignId },
      })

      if (!campaign) {
        return reply.status(404).send({ error: 'Campaign not found' })
      }

      const flow = await prisma.flow.create({
        data: {
          ...result.data,
          campaignId: request.params.campaignId,
        },
        include: { filters: true },
      })

      return reply.status(201).send({ flow })
    }
  )

  // PATCH /flows/:id
  app.patch<{ Params: { id: string } }>('/flows/:id', async (request, reply) => {
    const result = updateFlowSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation error',
        message: result.error.errors[0].message,
      })
    }

    const flow = await prisma.flow.findUnique({
      where: { id: request.params.id },
    })

    if (!flow) {
      return reply.status(404).send({ error: 'Flow not found' })
    }

    const updated = await prisma.flow.update({
      where: { id: request.params.id },
      data: result.data,
      include: { filters: true },
    })

    return { flow: updated }
  })

  // DELETE /flows/:id
  app.delete<{ Params: { id: string } }>('/flows/:id', async (request, reply) => {
    const flow = await prisma.flow.findUnique({
      where: { id: request.params.id },
    })

    if (!flow) {
      return reply.status(404).send({ error: 'Flow not found' })
    }

    await prisma.flow.delete({ where: { id: request.params.id } })

    return reply.status(204).send()
  })

  // PUT /campaigns/:campaignId/flows/reorder — drag and drop
  app.put<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/flows/reorder',
    async (request, reply) => {
      const { order } = request.body as { order: { id: string; position: number }[] }

      if (!Array.isArray(order)) {
        return reply.status(400).send({ error: 'order must be an array' })
      }

      await prisma.$transaction(
        order.map(({ id, position }) =>
          prisma.flow.update({
            where: { id },
            data: { position },
          })
        )
      )

      return { success: true }
    }
  )
}
