import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { loginSchema, createUserSchema } from '../schemas/auth'
import { requireAdmin, requireAuth } from '../middleware/auth'

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post('/auth/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation error',
        message: result.error.errors[0].message,
      })
    }

    const { email, password } = result.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      })
    }

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  })

  // GET /auth/me
  app.get('/auth/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { id: string }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    return { user }
  })

  // POST /auth/users — только для админа
  app.post('/auth/users', { preHandler: [requireAdmin] }, async (request, reply) => {
    const result = createUserSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation error',
        message: result.error.errors[0].message,
      })
    }

    const { email, password, name, role } = result.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'User with this email already exists',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
      select: { id: true, email: true, name: true, role: true },
    })

    return reply.status(201).send({ user })
  })
}

// Тип для request.user
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string
      email: string
      role: string
    }
  }
}
