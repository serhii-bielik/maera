import type { FastifyRequest, FastifyReply } from 'fastify'
import { Role } from '@maera/shared'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' })
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    const user = request.user as { role: string }
    if (user.role !== Role.ADMIN) {
      reply.status(403).send({ error: 'Forbidden', message: 'Admin access required' })
    }
  } catch {
    reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' })
  }
}
