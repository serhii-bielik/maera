import { describe, it, expect, beforeAll } from 'vitest'
import { buildApp } from '../app'
import { prisma } from '../lib/prisma'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeAll(async () => {
  app = buildApp()
  await app.ready()

  // Создаём тестовую кампанию
  await prisma.campaign.create({
    data: {
      name: 'Test',
      alias: 'testclick',
      flows: {
        create: [
          {
            name: 'Main',
            type: 'URL',
            url: 'https://example.com',
            redirectType: 'HTTP_302',
            position: 0,
            isDefault: false,
          },
          {
            name: 'Default',
            type: 'ACTION',
            action: 'NOT_FOUND',
            position: 999,
            isDefault: true,
          },
        ],
      },
    },
  })
})

afterAll(async () => {
  await app.close()
})

describe('GET /:alias', () => {
  it('redirects to flow URL', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/testclick',
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('https://example.com')
  })

  it('returns 404 for unknown alias', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/nonexistent',
    })
    expect(response.statusCode).toBe(404)
  })

  it('health endpoint returns ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.status).toBe('ok')
  })
})
