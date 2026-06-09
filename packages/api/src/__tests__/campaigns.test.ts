import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../app'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authToken: string

beforeAll(async () => {
  app = await buildApp()
  await app.ready()

  await prisma.user.create({
    data: {
      email: 'campaigns.admin@maera.io',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  })

  const loginRes = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'campaigns.admin@maera.io', password: 'admin123' },
  })
  authToken = JSON.parse(loginRes.body).token
})

afterAll(async () => {
  await app.close()
})

describe('POST /campaigns', () => {
  it('creates campaign with generated alias', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { name: 'Test Campaign' },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.campaign.name).toBe('Test Campaign')
    expect(body.campaign.alias).toBeTruthy()
    expect(body.campaign.alias.length).toBeGreaterThan(0)
  })

  it('creates campaign with custom alias', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { name: 'Custom Alias', alias: 'myalias' },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.campaign.alias).toBe('myalias')
  })

  it('returns 409 on duplicate alias', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { name: 'Duplicate', alias: 'myalias' },
    })
    expect(response.statusCode).toBe(409)
  })

  it('returns 401 without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      payload: { name: 'Unauthorized' },
    })
    expect(response.statusCode).toBe(401)
  })
})

describe('GET /campaigns', () => {
  it('returns list of campaigns', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/campaigns',
      headers: { Authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(Array.isArray(body.campaigns)).toBe(true)
  })
})
