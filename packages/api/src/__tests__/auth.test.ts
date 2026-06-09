import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../app'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()

  await prisma.user.create({
    data: {
      email: 'test@maera.io',
      password: await bcrypt.hash('password123', 10),
      role: 'ADMIN',
    },
  })
})

afterAll(async () => {
  await app.close()
})

describe('POST /auth/login', () => {
  it('returns token on valid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@maera.io', password: 'password123' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.token).toBeTruthy()
    expect(body.user.email).toBe('test@maera.io')
  })

  it('returns 401 on invalid password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@maera.io', password: 'wrongpassword' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 on invalid email format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'notanemail', password: 'password123' },
    })
    expect(response.statusCode).toBe(400)
  })
})

describe('GET /auth/me', () => {
  it('returns user data with valid token', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@maera.io', password: 'password123' },
    })
    const { token } = JSON.parse(loginResponse.body)

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.user.email).toBe('test@maera.io')
  })

  it('returns 401 without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
    })
    expect(response.statusCode).toBe(401)
  })
})
